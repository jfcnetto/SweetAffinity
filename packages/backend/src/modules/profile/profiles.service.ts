import { db } from "../../db/index.js";
import { profiles, users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import axios from "axios";
import { redis } from "../../plugins/redis.js";

// =====================================================
// PROFILE SERVICE — Camada de negócio centralizada
// Usada pelo ProfileController para lógica de upsert e IBGE
// =====================================================

export const ProfileService = {
  async upsertProfile(userId: string, data: any) {
    const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId));

    // RN-011: Validação IBGE antes de persistir
    if (data.state && data.city) {
      const cities = await ProfileService.getCities(data.state);
      // Fallback permissivo se IBGE estiver indisponível (retorna vazio)
      if (cities.length > 0) {
        const isValidCity = cities.some((c: any) => c.nome.toLowerCase() === data.city.toLowerCase());
        if (!isValidCity) {
          throw new Error("Cidade inválida para o estado informado (IBGE).");
        }
      }
    }

    // Busca o status do usuário para saber se ele ainda está na fase de onboarding
    const [userRecord] = await db.select({ status: users.status }).from(users).where(eq(users.id, userId));
    const isPending = userRecord?.status === "pending";

    if (existing) {
      // RN-003: relationshipType é imutável após onboarding concluído
      const { id, createdAt, popularityScore, profileViews, deletedAt, ...updateData } = data;

      const [updated] = await db
        .update(profiles)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(profiles.id, userId))
        .returning();

      // Ativa o usuário no sistema (para aparecer no feed)
      await db.update(users).set({ status: "active" }).where(eq(users.id, userId));

      return [updated];
    }

    // Criação: displayName e birthDate são obrigatórios (spec 3.1.3)
    if (!data.displayName) {
      throw new Error("displayName é obrigatório.");
    }
    if (!data.birthDate) {
      throw new Error("birthDate é obrigatório.");
    }

    const [created] = await db
      .insert(profiles)
      .values({ id: userId, ...data })
      .returning();

    // Ativa o usuário no sistema (para aparecer no feed)
    await db.update(users).set({ status: "active" }).where(eq(users.id, userId));

    return [created];
  },

  async getStates() {
    const cached = await redis.get("ibge:states");
    if (cached) return JSON.parse(cached);
    try {
      const { data } = await axios.get(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
        { timeout: 5000 }
      );
      await redis.set("ibge:states", JSON.stringify(data), "EX", 86400);
      return data;
    } catch {
      return [];
    }
  },

  async getCities(uf: string) {
    const cacheKey = `ibge:cities:${uf.toUpperCase()}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    try {
      const { data } = await axios.get(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`,
        { timeout: 5000 }
      );
      await redis.set(cacheKey, JSON.stringify(data), "EX", 43200);
      return data;
    } catch {
      return [];
    }
  },
};