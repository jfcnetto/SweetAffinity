import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { eq, ne, and, ilike } from "drizzle-orm";
import axios from "axios";
import { redis } from "../plugins/redis.js";

// =====================================================
// PROFILE SERVICE & LOGIC
// =====================================================

export const ProfileService = {
  async upsertProfile(userId: string, data: any) {
    const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId));
    
    if (existing) {
      const { profileType, ...updateData } = data;
      return await db.update(profiles).set(updateData).where(eq(profiles.id, userId)).returning();
    }
    
    return await db.insert(profiles).values({ id: userId, ...data }).returning();
  },

  async getStates() {
    const cached = await redis.get("ibge:states");
    if (cached) return JSON.parse(cached);
    try {
      const { data } = await axios.get("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
      await redis.set("ibge:states", JSON.stringify(data), "EX", 86400);
      return data;
    } catch { return []; }
  },

  async getCities(uf: string) {
    const cacheKey = `ibge:cities:${uf.toUpperCase()}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    try {
      const { data } = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 43200);
      return data;
    } catch { return []; }
  }
};

// =====================================================
// PROFILE ROUTES
// =====================================================

export const profileRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: string; profileType: "user" | "admin"; relationshipType?: "baby" | "sugar_daddy" | "sugar_mommy"; };
      const { page = "1", limit = "20" } = request.query as any;

      let targetTypes: string[] = user.relationshipType === "baby" ? ["sugar_daddy", "sugar_mommy"] : ["baby"];

      const result = await db.select().from(profiles).where(ne(profiles.id, user.id))
        .limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

      const filtered = result.filter((profile) => targetTypes.includes(profile.relationshipType as any));
      return reply.send(filtered);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar perfis." });
    }
  });

  fastify.post("/", { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const userId = request.user.id;
      const profile = await ProfileService.upsertProfile(userId, request.body);
      return reply.status(201).send(profile);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(422).send({ message: error.message });
    }
  });

  fastify.get("/ibge/states", async (request, reply) => {
    return await ProfileService.getStates();
  });

  fastify.get("/ibge/states/:uf/cities", async (request, reply) => {
    const { uf } = request.params as { uf: string };
    return await ProfileService.getCities(uf);
  });
};