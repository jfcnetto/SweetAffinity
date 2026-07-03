import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  broadcastCampaigns,
  notifications,
  users,
  userCrmNotes,
} from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { requirePermission } from "../middleware/rbac.js";

export async function communicationsRoutes(app: FastifyInstance) {

  // =====================================================
  // GET /admin/communications/campaigns
  // Lista campanhas de comunicação
  // =====================================================
  app.get("/campaigns", {
    preHandler: [requirePermission("communications.send")]
  }, async (req: any, reply: FastifyReply) => {
    const { status, limit = 20, offset = 0 } = req.query as {
      status?: string;
      limit?: number;
      offset?: number;
    };

    try {
      const result = await db.execute(sql`
        SELECT
          bc.id, bc.title, bc.type, bc.status,
          bc.sent_count, bc.opened_count,
          bc.scheduled_for, bc.sent_at, bc.created_at,
          u.email AS created_by_email
        FROM broadcast_campaigns bc
        LEFT JOIN users u ON u.id = bc.created_by
        ${status ? sql`WHERE bc.status = ${status}` : sql``}
        ORDER BY bc.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `);

      const totalResult = await db.execute(sql`
        SELECT count(*) FROM broadcast_campaigns
        ${status ? sql`WHERE status = ${status}` : sql``}
      `);

      return reply.send({
        campaigns: result.rows,
        total: Number(totalResult.rows[0].count),
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar campanhas." });
    }
  });

  // =====================================================
  // POST /admin/communications/campaigns — Criar campanha
  // =====================================================
  app.post("/campaigns", {
    preHandler: [requirePermission("communications.send")]
  }, async (req: any, reply: FastifyReply) => {
    const {
      title,
      type,
      targetSegment,
      subject,
      bodyHtml,
      notificationTitle,
      notificationBody,
      scheduledFor,
    } = req.body as {
      title: string;
      type: "email" | "notification" | "both";
      targetSegment?: Record<string, unknown>;
      subject?: string;
      bodyHtml?: string;
      notificationTitle?: string;
      notificationBody?: string;
      scheduledFor?: string;
    };
    const adminId = (req.user as any).sub;

    try {
      const [campaign] = await db
        .insert(broadcastCampaigns)
        .values({
          title,
          type,
          targetSegment,
          subject,
          bodyHtml,
          notificationTitle,
          notificationBody,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          createdBy: adminId,
        })
        .returning();

      return reply.status(201).send({ campaign });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao criar campanha." });
    }
  });

  // =====================================================
  // POST /admin/communications/campaigns/:id/send
  // Dispara campanha imediatamente (notificações in-app)
  // =====================================================
  app.post("/campaigns/:id/send", {
    preHandler: [requirePermission("communications.send")]
  }, async (req: any, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    try {
      const [campaign] = await db
        .select()
        .from(broadcastCampaigns)
        .where(eq(broadcastCampaigns.id, id))
        .limit(1);

      if (!campaign) {
        return reply.status(404).send({ message: "Campanha não encontrada." });
      }

      if (campaign.status === "sent") {
        return reply.status(409).send({ message: "Campanha já foi enviada." });
      }

      // Atualiza status para 'sending'
      await db
        .update(broadcastCampaigns)
        .set({ status: "sending" })
        .where(eq(broadcastCampaigns.id, id));

      // Busca usuários-alvo com base no segmento
      const segment = campaign.targetSegment as any ?? {};
      let whereConditions = sql`1=1`;

      if (segment.status) {
        whereConditions = sql`${whereConditions} AND u.status = ${segment.status}`;
      }
      if (segment.isPremium !== undefined) {
        whereConditions = sql`${whereConditions} AND u.is_premium = ${segment.isPremium}`;
      }

      const targetUsers = await db.execute(sql`
        SELECT u.id FROM users u
        WHERE ${whereConditions}
        LIMIT 10000
      `);

      const userIds = targetUsers.rows.map((r: any) => r.id);
      let sentCount = 0;

      // Dispara notificações in-app (se tipo for notification ou both)
      if (["notification", "both"].includes(campaign.type) && campaign.notificationTitle) {
        for (const uid of userIds) {
          try {
            await db.insert(notifications).values({
              userId: uid,
              type: "system",
              title: campaign.notificationTitle ?? "Novidade!",
              body: campaign.notificationBody ?? "",
              link: "/feed",
            });
            sentCount++;
          } catch {
            // continua mesmo com erro individual
          }
        }
      }

      // E-mail: aqui seria integrado com o EmailService (Nodemailer/Resend)
      // Por ora, registra a quantidade de destinatários
      if (["email", "both"].includes(campaign.type)) {
        // TODO: integrar com EmailService.sendBulk(userIds, campaign.subject, campaign.bodyHtml)
        sentCount = sentCount || userIds.length;
      }

      // Atualiza campanha como enviada
      await db
        .update(broadcastCampaigns)
        .set({
          status: "sent",
          sentCount,
          sentAt: new Date(),
        })
        .where(eq(broadcastCampaigns.id, id));

      return reply.send({
        success: true,
        sentCount,
        message: `Campanha enviada para ${sentCount} usuários.`,
      });
    } catch (error) {
      app.log.error(error);
      // Marca como falha
      await db
        .update(broadcastCampaigns)
        .set({ status: "failed" })
        .where(eq(broadcastCampaigns.id, id));
      return reply.status(500).send({ message: "Erro ao enviar campanha." });
    }
  });

  // =====================================================
  // GET /admin/communications/campaigns/:id — Detalhe
  // =====================================================
  app.get("/campaigns/:id", {
    preHandler: [requirePermission("communications.send")]
  }, async (req: any, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    try {
      const [campaign] = await db
        .select()
        .from(broadcastCampaigns)
        .where(eq(broadcastCampaigns.id, id))
        .limit(1);

      if (!campaign) return reply.status(404).send({ message: "Campanha não encontrada." });
      return reply.send({ campaign });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar campanha." });
    }
  });

  // =====================================================
  // CRM NOTES — Notas internas por usuário
  // =====================================================

  // POST /admin/communications/notes/:userId
  app.post("/notes/:userId", {
    preHandler: [requirePermission("users.edit")]
  }, async (req: any, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };
    const { content } = req.body as { content: string };
    const authorId = (req.user as any).sub;

    try {
      const [note] = await db
        .insert(userCrmNotes)
        .values({ userId, authorId, content })
        .returning();
      return reply.status(201).send({ note });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao adicionar nota." });
    }
  });

  // GET /admin/communications/notes/:userId
  app.get("/notes/:userId", {
    preHandler: [requirePermission("users.view")]
  }, async (req: any, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };
    try {
      const result = await db.execute(sql`
        SELECT
          n.id, n.content, n.created_at,
          p.display_name AS author_name,
          u.email AS author_email
        FROM user_crm_notes n
        JOIN users u ON u.id = n.author_id
        LEFT JOIN profiles p ON p.id = n.author_id
        WHERE n.user_id = ${userId}
        ORDER BY n.created_at DESC
      `);
      return reply.send({ notes: result.rows });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar notas." });
    }
  });
}
