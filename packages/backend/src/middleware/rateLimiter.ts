import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { redis } from "../plugins/redis.js";

// =====================================================
// SLIDING WINDOW — Lua script atômico no Redis
// Garante precisão sem race conditions (spec seção 3.4.1)
// Usa Sorted Set: cada entrada = timestamp da requisição
// =====================================================
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local window_start = now - window_ms

-- Remove entradas fora da janela deslizante
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Conta requisições na janela atual
local count = tonumber(redis.call('ZCARD', key))

if count < limit then
  -- Adiciona requisição atual com score = timestamp (+ random para unicidade)
  local member = tostring(now) .. tostring(math.random(100000))
  redis.call('ZADD', key, now, member)
  -- TTL = tamanho da janela em segundos (arredondado para cima)
  redis.call('PEXPIRE', key, window_ms)
  -- Retorna: [permitido=1, restantes, retry_after_ms=0]
  return {1, limit - count - 1, 0}
else
  -- Bloqueia: calcula quando a entrada mais antiga vai expirar
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry_after_ms = 0
  if #oldest >= 2 then
    local oldest_score = tonumber(oldest[2])
    retry_after_ms = math.max(0, oldest_score + window_ms - now)
  end
  -- Retorna: [permitido=0, restantes=0, retry_after_ms]
  return {0, 0, retry_after_ms}
end
`;

// =====================================================
// CONFIGURAÇÃO POR ENDPOINT (spec seção 3.4.2)
// =====================================================
export const RATE_LIMIT_CONFIG = {
  authRegister: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 min
    redisKeyPrefix: "rl:register",
  },
  authLogin: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 min
    redisKeyPrefix: "rl:login",
  },
  authForgot: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 60 min
    redisKeyPrefix: "rl:forgot",
  },
  ibge: {
    max: 60,
    windowMs: 60 * 1000, // 1 min
    redisKeyPrefix: "rl:ibge",
  },
  profilesPublic: {
    max: 30,
    windowMs: 60 * 1000, // 1 min
    redisKeyPrefix: "rl:profiles",
  },
  plans: {
    max: 60,
    windowMs: 60 * 1000, // 1 min
    redisKeyPrefix: "rl:plans",
  },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMIT_CONFIG;

// =====================================================
// FACTORY: cria um preHandler hook para uma rota específica
// Uso: preHandler: [createRateLimitHook('authLogin')]
// =====================================================
export function createRateLimitHook(configKey: RateLimitKey) {
  const config = RATE_LIMIT_CONFIG[configKey];

  return async function rateLimitHook(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const ip = request.ip;
    const redisKey = `${config.redisKeyPrefix}:${ip}`;
    const now = Date.now();

    try {
      const result = (await redis.eval(
        SLIDING_WINDOW_LUA,
        1,           // número de chaves
        redisKey,    // KEYS[1]
        String(now),              // ARGV[1]: timestamp atual em ms
        String(config.windowMs),  // ARGV[2]: tamanho da janela em ms
        String(config.max)        // ARGV[3]: limite de requisições
      )) as [number, number, number];

      const [allowed, remaining, retryAfterMs] = result;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      const resetTimestamp = Math.ceil((now + config.windowMs) / 1000);

      // Headers obrigatórios pela spec (seção 3.4.3)
      reply.header("X-RateLimit-Limit", String(config.max));
      reply.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));
      reply.header("X-RateLimit-Reset", String(resetTimestamp));

      if (!allowed) {
        reply.header("Retry-After", String(retryAfterSec));
        return reply.status(429).send({
          statusCode: 429,
          error: "Too Many Requests",
          message: `Limite de requisições excedido. Tente novamente em ${retryAfterSec} segundos.`,
          retryAfter: retryAfterSec,
        });
      }
    } catch (err) {
      // ✅ Fail-open: se Redis cair, a requisição é PERMITIDA com alerta
      // (spec seção 7: "se Redis cair, rate limit é desativado (fail-open)")
      request.log.warn(
        { err, redisKey },
        "⚠️ Rate limiter Redis indisponível — fail-open ativado"
      );
      // Não bloqueia — apenas loga e continua
    }
  };
}

// =====================================================
// PLUGIN GLOBAL: fallback de 100 req/min para rotas
// que não têm rate limit específico por endpoint.
// Registrado via setupRateLimiter() no index.ts.
// =====================================================
export const setupRateLimiter = fp(
  async (fastify: FastifyInstance) => {
    const { default: rateLimit } = await import("@fastify/rate-limit");

    await fastify.register(rateLimit, {
      global: true,
      max: 100,
      timeWindow: "1 minute",
      redis: redis,
      skipOnError: true, // Fail-open se Redis indisponível
      keyGenerator: (request: FastifyRequest) => request.ip,
      errorResponseBuilder: (_request, context) => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: `Limite de requisições excedido. Tente novamente em ${Math.ceil(
          context.ttl / 1000
        )} segundos.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      }),
    });

    fastify.log.info("✅ Rate limiter global registrado (100 req/min fallback)");
  },
  {
    name: "rate-limiter",
    fastify: "4.x",
  }
);

// =====================================================
// EXEMPLO DE USO NOS CONTROLLERS:
//
// import { createRateLimitHook } from '../middleware/rateLimiter.js';
//
// fastify.post('/auth/login', {
//   preHandler: [createRateLimitHook('authLogin')],
// }, loginHandler);
//
// fastify.post('/auth/register', {
//   preHandler: [createRateLimitHook('authRegister')],
// }, registerHandler);
// =====================================================
