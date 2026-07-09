import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { eq } from "drizzle-orm";

// Guardar os timestamps em memória para controlar o throttling (5 minutos)
const activityCache = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000;

export async function activityMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Tenta obter o usuário autenticado da requisição
    const user = request.user as { sub: string } | undefined;
    if (!user || !user.sub) return;

    const userId = user.sub;
    const now = Date.now();
    const lastUpdate = activityCache.get(userId);

    // Se já atualizou nos últimos 5 minutos, pula para economizar recursos do banco
    if (lastUpdate && now - lastUpdate < THROTTLE_MS) {
      return;
    }

    // Atualiza em background de forma assíncrona (não bloqueia a resposta do cliente)
    db.update(profiles)
      .set({ lastActiveAt: new Date() })
      .where(eq(profiles.id, userId))
      .then(() => {
        activityCache.set(userId, now);
      })
      .catch((err) => {
        console.error(`[ActivityMiddleware] Erro ao atualizar lastActiveAt para ${userId}:`, err);
      });
  } catch (err) {
    // Pula silenciosamente em caso de erro no middleware
    console.error("[ActivityMiddleware] Erro inesperado:", err);
  }
}
