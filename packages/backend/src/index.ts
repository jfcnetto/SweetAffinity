import "./env.js";

import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import oauthPlugin from "@fastify/oauth2";
import { Server } from "socket.io";

// DB
import { testDatabase } from "./db/index.js";

// Plugins
import jwtPlugin from "./plugins/jwt.js";

// Rate Limiter — plugin centralizado com sliding window por endpoint
import { setupRateLimiter } from "./middleware/rateLimiter.js";

// Routes
import { authRoutes } from "./modules/auth/auth.controller.js";
import { photoRoutes } from "./controllers/PhotoController.js";
import { profileRoutes } from "./controllers/ProfileController.js";
import { ibgeRoutes } from "./controllers/IbgeController.js"; // ✅ ADICIONADO
import {
  messageRoutes,
  initChatSocket,
} from "./controllers/MessageController.js";
import { adminRoutes } from "./controllers/AdminController.js";
import { matchRoutes } from "./controllers/MatchController.js";

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
  // Necessário para que request.ip retorne o IP real vindo do Nginx
  trustProxy: true,
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
    // PLUGINS (ordem obrigatória: cors → rateLimit → multipart → jwt)
    // =====================================================

    await server.register(cors, {
      origin: process.env.APP_URL || "http://localhost:3000",
      credentials: true,
    });

    // ✅ CORRIGIDO: Rate Limiting centralizado via setupRateLimiter
    // Implementa sliding window com Lua e limites por endpoint
    // O index.ts NÃO registra @fastify/rate-limit diretamente — evita duplo registro
    await setupRateLimiter(server);

    // Multipart — necessário para upload de fotos
    await server.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB — conforme RN-015
      },
    });

    await server.register(jwtPlugin);

    // =====================================================
    // OAUTH2 (GOOGLE)
    // =====================================================
    await server.register(oauthPlugin, {
      name: 'googleOAuth2',
      credentials: {
        client: {
          id: process.env.GOOGLE_CLIENT_ID || 'DUMMY_CLIENT_ID',
          secret: process.env.GOOGLE_CLIENT_SECRET || 'DUMMY_CLIENT_SECRET'
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION
      },
      // startRedirectPath: URL que o frontend vai chamar para iniciar o fluxo
      startRedirectPath: '/auth/google',
      // callbackUri: URL registrada no Google Cloud Console
      callbackUri: 'http://localhost:4000/auth/google/callback',
      scope: ['profile', 'email']
    });

    // =====================================================
    // ROUTES
    // =====================================================

    // Auth — as rotas internas devem registrar o prefixo /auth
    await server.register(authRoutes);

    await server.register(profileRoutes, {
      prefix: "/profiles",
    });

    await server.register(photoRoutes, {
      prefix: "/photos",
    });

    // ✅ ADICIONADO: rotas IBGE (proxy com cache Redis)
    await server.register(ibgeRoutes, {
      prefix: "/ibge",
    });

    await server.register(messageRoutes, {
      prefix: "/messages",
    });

    await server.register(adminRoutes, {
      prefix: "/admin",
    });

    await server.register(matchRoutes);

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
