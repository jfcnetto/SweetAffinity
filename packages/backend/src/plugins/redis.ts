import { Redis } from "ioredis";

// =====================================================
// REDIS CLIENT — Singleton para toda a aplicação
// Usado por: rateLimiter, ibge.service, profiles.service
// =====================================================

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  // Reconexão automática com backoff exponencial
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Não lança erro se Redis estiver indisponível (fail-open)
  enableOfflineQueue: false,

  maxRetriesPerRequest: 1,

  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("✅ Redis conectado.");
});

redis.on("error", (err: Error) => {
  // Apenas loga — não derruba o servidor (fail-open)
  console.warn("⚠️ Redis indisponível:", err.message);
});
