import { redis } from "../plugins/redis.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const FREE_LIMIT = 10;

export class MessageQuotaService {
  /**
   * Retorna a chave do Redis para a cota do usuário no mês atual.
   */
  private static getQuotaKey(userId: string): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `msg_quota:${userId}:${year}-${month}`;
  }

  /**
   * Verifica se o usuário é Premium.
   */
  private static async isUserPremium(userId: string): Promise<boolean> {
    try {
      const [user] = await db
        .select({ isPremium: users.isPremium })
        .from(users)
        .where(eq(users.id, userId));
      return user?.isPremium || false;
    } catch {
      return false; // Em caso de erro no banco, assume gratuito
    }
  }

  /**
   * Obtém a cota atual de mensagens do usuário.
   */
  static async getMessageQuota(userId: string): Promise<{ remaining: number; limit: number; isPremium: boolean }> {
    const isPremium = await this.isUserPremium(userId);
    if (isPremium) {
      return { remaining: 9999, limit: 9999, isPremium: true };
    }

    const key = this.getQuotaKey(userId);
    try {
      const val = await redis.get(key);
      if (val === null) {
        return { remaining: FREE_LIMIT, limit: FREE_LIMIT, isPremium: false };
      }
      const consumed = parseInt(val, 10);
      return { remaining: Math.max(0, FREE_LIMIT - consumed), limit: FREE_LIMIT, isPremium: false };
    } catch (err) {
      console.error("[MessageQuota] Erro ao buscar cota no Redis:", err);
      // Fallback seguro: assume que esgotou se o Redis falhar e não pudermos validar
      return { remaining: 0, limit: FREE_LIMIT, isPremium: false };
    }
  }

  /**
   * Consome 1 mensagem da cota do usuário.
   * Retorna true se foi consumido com sucesso (ou se for premium), false se a cota acabou.
   */
  static async consumeMessage(userId: string): Promise<boolean> {
    const isPremium = await this.isUserPremium(userId);
    if (isPremium) return true;

    const key = this.getQuotaKey(userId);
    try {
      // Usar transação / multi ou incr do Redis
      const current = await redis.incr(key);
      if (current === 1) {
        // Primeira mensagem do mês, define TTL de 31 dias para limpar
        await redis.expire(key, 31 * 24 * 60 * 60);
      }

      if (current > FREE_LIMIT) {
        // Se ultrapassou o limite, mantemos o valor mas retornamos falso
        return false;
      }
      return true;
    } catch (err) {
      console.error("[MessageQuota] Erro ao incrementar cota no Redis:", err);
      return false; // Fallback: bloqueia se o Redis estiver fora do ar para evitar abuso
    }
  }
}
