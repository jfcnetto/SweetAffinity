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
import { paymentRoutes } from "./controllers/PaymentController.js";
import { plansRoutes } from "./controllers/PlansController.js";
import { notificationRoutes } from "./controllers/NotificationController.js";
import { lgpdRoutes } from "./controllers/LgpdController.js";
import { subscriptionRoutes } from "./controllers/SubscriptionController.js";
// CRM
import { financeRoutes } from "./controllers/FinanceController.js";
import { aiUsageRoutes } from "./controllers/AiUsageController.js";
import { accessRoutes } from "./controllers/AccessController.js";
import { communicationsRoutes } from "./controllers/CommunicationsController.js";
import { siteSettingsRoutes } from "./controllers/SiteSettingsController.js";
import { blogRoutes } from "./controllers/BlogController.js";

// Segurança & Monitoramento
import helmet from "@fastify/helmet";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

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
    // Inicialização do Sentry (Monitoramento)
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "",
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: process.env.NODE_ENV || "development",
    });

    server.setErrorHandler(function (error, request, reply) {
      if (process.env.NODE_ENV === "production") {
        Sentry.captureException(error);
      }
      this.log.error(error);
      // Retorna 500 para não vazar a stacktrace da AWS/DB para o cliente
      reply.status(500).send({ message: "Internal Server Error" });
    });

    await testDatabase();
    server.log.info("✅ Banco conectado");

    // Executa bootstrap do banco de dados para criar tabelas/colunas se não existirem (Passo 1)
    const { bootstrapDatabase } = await import("./db/bootstrap.js");
    await bootstrapDatabase();

    // =====================================================
    // PLUGINS (ordem obrigatória: cors/helmet → rateLimit → multipart → jwt)
    // =====================================================

    // Segurança contra OWASP Top 10 (Cabeçalhos HTTP)
    await server.register(helmet, {
      global: true,
    });

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

    // Hook global para atualizar lastActiveAt (Passo 5)
    server.addHook("preHandler", async (request, reply) => {
      try {
        if (request.headers.authorization) {
          await request.jwtVerify();
          const { activityMiddleware } = await import("./middleware/activity.middleware.js");
          await activityMiddleware(request, reply);
        }
      } catch (err) {
        // Ignora erros de JWT aqui para deixar os controllers/guards de rota tratarem
      }
    });

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
        auth: {
          tokenHost: 'https://oauth2.googleapis.com',
          tokenPath: '/token',
          authorizeHost: 'https://accounts.google.com',
          authorizePath: '/o/oauth2/v2/auth'
        }
      },
      // startRedirectPath: URL que o frontend vai chamar para iniciar o fluxo
      startRedirectPath: '/auth/google',
      // callbackUri: URL registrada no Google Cloud Console
      callbackUri: process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/auth/google/callback` : 'http://localhost:4000/auth/google/callback',
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

    await server.register(paymentRoutes, {
      prefix: "/payment",
    });

    await server.register(plansRoutes);

    await server.register(notificationRoutes, {
      prefix: "/notifications",
    });

    await server.register(lgpdRoutes, {
      prefix: "/lgpd",
    });

    await server.register(subscriptionRoutes, {
      prefix: "/subscriptions",
    });

    await server.register(blogRoutes, {
      prefix: "/blog",
    });

    // CRM — Painel Administrativo Completo
    await server.register(financeRoutes, {
      prefix: "/admin/finance",
    });

    await server.register(aiUsageRoutes, {
      prefix: "/admin/ai",
    });

    await server.register(accessRoutes, {
      prefix: "/admin/access",
    });

    await server.register(communicationsRoutes, {
      prefix: "/admin/communications",
    });

    await server.register(siteSettingsRoutes, {
      prefix: "/admin/settings",
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

    // Executa o seed de planos em background no início da aplicação (Passo 6)
    import("./db/seed-plans.js")
      .then(() => console.log("🌱 Seed de planos executado com sucesso no startup."))
      .catch((err) => console.error("⚠️ Falha ao importar/executar seed de planos:", err));

    // Promove contas locais para admin para facilitar desenvolvimento do CRM
    import("./make-admin.js")
      .catch((err) => console.error("⚠️ Falha ao executar make-admin:", err));

    const { runDailyBlogCron } = await import("./jobs/blogGenerator.js");
    
    setInterval(() => {
      runDailyBlogCron().catch(err => server.log.error(err));
    }, 24 * 60 * 60 * 1000); // Roda a cada 24 horas

    // =====================================================
    // INACTIVE PROFILES JOB (Passo 5)
    // =====================================================
    const { runInactiveProfilesJob } = await import("./jobs/inactiveProfilesJob.js");
    setInterval(() => {
      runInactiveProfilesJob().catch(err => server.log.error(err));
    }, 24 * 60 * 60 * 1000); // Roda a cada 24 horas

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
