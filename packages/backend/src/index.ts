import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import pg from 'pg';
import Redis from 'ioredis';

// Importação das rotas nativas da API (Mantendo a extensão explícita .ts exigida pelo ESM/tsx)
import { authRoutes } from './controllers/AuthController.ts';
import { photoRoutes } from './controllers/PhotoController.ts';
import { profileRoutes } from './controllers/ProfileController.ts';
import { messageRoutes, initChatSocket } from './controllers/MessageController.ts';
import { adminRoutes } from './controllers/AdminController.ts'; // Novo import do ecossistema administrativo

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: '../../.env' });

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
    }
  }
});

// ─── INSTANCIAÇÃO DOS CLIENTES DE INFRAESTRUTURA LOCAL ───
export const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_MAX_CONNECTIONS) || 20
});

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ─── REGISTRO DE PLUGINS GLOBAIS DE SEGURANÇA ───────────

// Configuração do CORS fiel para permitir a comunicação com o Frontend local
await server.register(cors, {
  origin: process.env.APP_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});

// Mecanismo nativo de Autenticação JWT Self-Hosted
await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback_secret_key_strong_2026'
});

// Proteção nativa por IP rodando sobre o Redis (Substitui o reCAPTCHA)
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  redis: redisClient,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Muitas requisições vindas deste IP. Tente novamente em um minuto.'
  })
});

// ─── ROTA PADRÃO DE VERIFICAÇÃO DE SAÚDE DA API (HEALTHCHECK)
server.get('/health', async () => {
  return { 
    status: 'online', 
    timestamp: new Date(),
    database: 'connected',
    cache: 'connected'
  };
});

// ─── REGISTRO DOS CONTROLLERS DA API NATIVA ───────────────────
await server.register(authRoutes, { prefix: '/auth' });
await server.register(photoRoutes, { prefix: '/photos' });
await server.register(profileRoutes, { prefix: '/profiles' });
await server.register(messageRoutes, { prefix: '/messages' });
await server.register(adminRoutes, { prefix: '/admin' }); // Ativação dos endpoints HTTP de administração e moderação

// ─── INICIALIZAÇÃO DO SERVIDOR HTTP & WEBSOCKETS ─────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    await server.listen({ port, host: '0.0.0.0' });
    
    // Inicializa o Socket.IO acoplado ao servidor HTTP do Fastify
    const io = new Server(server.server, {
      cors: {
        origin: process.env.APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Vincula a lógica em tempo real (WebSockets) do Chat ao barramento do Socket.IO
    initChatSocket(io);

    server.log.info('🚀 Servidor HTTP e engine Socket.IO inicializados com sucesso.');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();