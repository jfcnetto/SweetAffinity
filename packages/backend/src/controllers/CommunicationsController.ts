import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  broadcastCampaigns,
  notifications,
  users,
  userCrmNotes,
} from "../db/schema.js";
import { eq, and, desc, count } from "drizzle-orm";
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
      const conditions = status ? eq(broadcastCampaigns.status, status as any) : undefined;
      const campaignsResult = await db
        .select({
          id: broadcastCampaigns.id,
          title: broadcastCampaigns.title,
          type: broadcastCampaigns.type,
          status: broadcastCampaigns.status,
          sentCount: broadcastCampaigns.sentCount,
          openedCount: broadcastCampaigns.openedCount,
          scheduledFor: broadcastCampaigns.scheduledFor,
          sentAt: broadcastCampaigns.sentAt,
          createdAt: broadcastCampaigns.createdAt,
          createdByEmail: users.email
        })
        .from(broadcastCampaigns)
        .leftJoin(users, eq(users.id, broadcastCampaigns.createdBy))
        .where(conditions)
        .orderBy(desc(broadcastCampaigns.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const [totalResult] = await db
        .select({ total: count() })
        .from(broadcastCampaigns)
        .where(conditions);

      return reply.send({
        campaigns: campaignsResult,
        total: Number(totalResult?.total ?? 0),
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
      let whereConditions = [];

      if (segment.status) {
        whereConditions.push(eq(users.status, segment.status));
      }
      if (segment.isPremium !== undefined) {
        whereConditions.push(eq(users.isPremium, segment.isPremium));
      }

      const targetUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .limit(10000);

      const userIds = targetUsers.map((r) => r.id);
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
      const notesResult = await db
        .select({
          id: userCrmNotes.id,
          content: userCrmNotes.content,
          createdAt: userCrmNotes.createdAt,
          authorName: profiles.displayName,
          authorEmail: users.email
        })
        .from(userCrmNotes)
        .innerJoin(users, eq(users.id, userCrmNotes.authorId))
        .leftJoin(profiles, eq(profiles.id, userCrmNotes.authorId))
        .where(eq(userCrmNotes.userId, userId))
        .orderBy(desc(userCrmNotes.createdAt));
        
      return reply.send({ notes: notesResult });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar notas." });
    }
  });
}
