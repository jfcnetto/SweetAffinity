import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { siteSettings } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requirePermission } from "../middleware/rbac.js";

// Chaves padrão do sistema com valores iniciais
const DEFAULT_SETTINGS: Record<string, unknown> = {
  maintenance_mode: false,
  free_daily_message_limit: 5,
  premium_price_cents: 29900,
  diamante_price_cents: 49900,
  new_registrations_open: true,
  recaptcha_enabled: false,
  ai_blog_auto_publish: false,
  profile_view_notification_premium_only: true,
  exchange_rate_usd_brl: 5.0,
  soft_launch_active: true,
  soft_launch_user_limit: 50,
  minimum_age: 18,
  max_photos_free: 5,
  max_photos_premium: 20,
};

export async function siteSettingsRoutes(app: FastifyInstance) {

  // =====================================================
  // GET /admin/settings — Todas as configurações
  // =====================================================
  app.get("/", {
    preHandler: [requirePermission("settings.edit")]
  }, async (_req, reply: FastifyReply) => {
    try {
      const rows = await db.select().from(siteSettings);

      // Monta objeto chave→valor
      const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
      for (const row of rows) {
        settings[row.key] = row.value;
      }

      return reply.send({ settings });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar configurações." });
    }
  });

  // =====================================================
  // PUT /admin/settings/:key — Atualizar uma configuração
  // =====================================================
  app.put("/:key", {
    preHandler: [requirePermission("settings.edit")]
  }, async (req: any, reply: FastifyReply) => {
    const { key } = req.params as { key: string };
    const { value } = req.body as { value: unknown };
    const adminId = (req.user as any).sub;

    if (!(key in DEFAULT_SETTINGS)) {
      return reply.status(400).send({
        message: `Chave '${key}' não é uma configuração válida.`,
        validKeys: Object.keys(DEFAULT_SETTINGS),
      });
    }

    try {
      // Upsert
      const existing = await db
        .select({ key: siteSettings.key })
        .from(siteSettings)
        .where(eq(siteSettings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(siteSettings)
          .set({ value, updatedBy: adminId })
          .where(eq(siteSettings.key, key));
      } else {
        await db.insert(siteSettings).values({ key, value, updatedBy: adminId });
      }

      return reply.send({ success: true, key, value });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao atualizar configuração." });
    }
  });

  // =====================================================
  // POST /admin/settings/seed — Inicializa configurações padrão
  // =====================================================
  app.post("/seed", {
    preHandler: [requirePermission("settings.edit")]
  }, async (req: any, reply: FastifyReply) => {
    const adminId = (req.user as any).sub;
    try {
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        const existing = await db
          .select({ key: siteSettings.key })
          .from(siteSettings)
          .where(eq(siteSettings.key, key))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(siteSettings).values({ key, value, updatedBy: adminId });
        }
      }
      return reply.send({ success: true, message: "Configurações padrão inicializadas." });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao inicializar configurações." });
    }
  });
}

/**
 * Helper para buscar uma configuração do site em qualquer serviço
 */
export async function getSetting<T = unknown>(key: string): Promise<T> {
  const rows = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  if (rows.length > 0) return rows[0].value as T;

  // Fallback para o padrão
  return (DEFAULT_SETTINGS[key] ?? null) as T;
}
