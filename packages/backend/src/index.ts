import "./env.js";

import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { Server } from "socket.io";

// DB
import { testDatabase } from "./db/index.js";

// Plugins
import jwtPlugin from "./plugins/jwt.js";

// Routes
import { authRoutes } from "./modules/auth/auth.controller.js";
import { photoRoutes } from "./controllers/PhotoController.js";
import { profileRoutes } from "./controllers/ProfileController.js";
import {
  messageRoutes,
  initChatSocket,
} from "./controllers/MessageController.js";
import { adminRoutes } from "./controllers/AdminController.js";

// =====================================================
// FASTIFY
// =====================================================

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
});

// =====================================================
// HEALTHCHECK
// =====================================================

server.get("/health", async () => {
  return {
    status: "online",
    timestamp: new Date(),
  };
});

// =====================================================
// BOOTSTRAP
// =====================================================

async function start() {
  try {
    server.log.info("🔄 Verificando conexão com PostgreSQL...");
    await testDatabase();
    server.log.info("✅ Banco conectado");

    // =====================================================
    // PLUGINS (ordem obrigatória: cors → rateLimit → jwt)
    // =====================================================

    await server.register(cors, {
      origin: process.env.APP_URL || "http://localhost:3000",
      credentials: true,
    });

    await server.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
      errorResponseBuilder: () => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: "Muitas requisições vindas deste IP.",
      }),
    });

    await server.register(jwtPlugin);

    // =====================================================
    // ROUTES
    // FIX: prefix aqui + rotas relativas dentro do controller
    // Exemplo: prefix "/auth" + rota "/register" = GET /auth/register
    // =====================================================

    await server.register(authRoutes);      // FIX: sem prefix — o auth.controller.ts
                                            // já define as rotas como /auth/register etc.
                                            // OU, se preferir prefixo aqui, remova o
                                            // "/auth" de dentro do auth.controller.ts

    await server.register(profileRoutes, {
      prefix: "/profiles",
    });

    await server.register(photoRoutes, {
      prefix: "/photos",
    });

    await server.register(messageRoutes, {
      prefix: "/messages",
    });

    await server.register(adminRoutes, {
      prefix: "/admin",
    });

    // =====================================================
    // START SERVER
    // =====================================================

    const port = Number(process.env.PORT || 4000);

    await server.listen({
      host: "0.0.0.0",
      port,
    });

    server.log.info(`🚀 Backend iniciado na porta ${port}`);

    // =====================================================
    // SOCKET.IO (iniciado após o servidor estar ouvindo)
    // =====================================================

    const io = new Server(server.server, {
      cors: {
        origin: process.env.APP_URL || "http://localhost:3000",
      },
    });

    initChatSocket(io);

    // =====================================================
    // GRACEFUL SHUTDOWN
    // =====================================================

    const shutdown = async (signal: string) => {
      server.log.info(`🛑 Recebido ${signal}. Encerrando servidor...`);

      try {
        io.close();
        await server.close();
        server.log.info("✅ Servidor encerrado com sucesso");
        process.exit(0);
      } catch (err) {
        server.log.error(err);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (err) {
    server.log.error("❌ FALHA NO STARTUP");
    server.log.error(err);
    process.exit(1);
  }
}

start();