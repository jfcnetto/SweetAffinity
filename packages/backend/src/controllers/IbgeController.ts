import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { redis } from "../plugins/redis.js";

// =====================================================
// IBGE ROUTES — Proxy com cache Redis
// TTL estados: 24h (86400s) | TTL cidades: 12h (43200s)
// Fallback silencioso: se a API do IBGE falhar, retorna []
// =====================================================

export const ibgeRoutes = async (fastify: FastifyInstance) => {
  // =====================================================
  // GET /ibge/states — Lista todos os estados
  // =====================================================

  fastify.get(
    "/states",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const CACHE_KEY = "ibge:states";
      const TTL = 86400; // 24h

      try {
        // 1. Tenta cache Redis
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return reply.send(JSON.parse(cached));
        }

        // 2. Busca da API do IBGE
        const { data } = await axios.get(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
          { timeout: 5000 }
        );

        // 3. Salva no cache
        await redis.set(CACHE_KEY, JSON.stringify(data), "EX", TTL);

        return reply.send(data);
      } catch (err) {
        // Fallback silencioso (RN-010): se IBGE falhar, retorna []
        fastify.log.warn({ err }, "⚠️ IBGE /states indisponível — fallback vazio");
        return reply.send([]);
      }
    }
  );

  // =====================================================
  // GET /ibge/states/:uf/cities — Cidades de um estado
  // =====================================================

  fastify.get(
    "/states/:uf/cities",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { uf } = request.params as { uf: string };
      const normalizedUf = uf.toUpperCase();
      const CACHE_KEY = `ibge:cities:${normalizedUf}`;
      const TTL = 43200; // 12h

      try {
        // 1. Tenta cache Redis
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return reply.send(JSON.parse(cached));
        }

        // 2. Busca da API do IBGE
        const { data } = await axios.get(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedUf}/municipios`,
          { timeout: 5000 }
        );

        // 3. Salva no cache
        await redis.set(CACHE_KEY, JSON.stringify(data), "EX", TTL);

        return reply.send(data);
      } catch (err) {
        // Fallback silencioso (RN-010)
        fastify.log.warn(
          { err, uf: normalizedUf },
          "⚠️ IBGE /cities indisponível — fallback vazio"
        );
        return reply.send([]);
      }
    }
  );
};
