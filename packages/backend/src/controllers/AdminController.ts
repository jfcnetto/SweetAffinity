import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  users,
  profiles,
  photos,
  reports,
  auditLogs,
  subscriptions,
  financialEvents,
  userSpecialAccess,
  userCrmNotes,
} from "../db/schema.js";
import { eq, desc, and, sum, count, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requirePermission } from "../middleware/rbac.js";

// =======================================================================
// ADMIN ROUTES
// =======================================================================

export const adminRoutes = async (fastify: FastifyInstance) => {
  // =======================================================================
  // 1. DASHBOARD & KPIs
  // =======================================================================

  fastify.get("/dashboard", {
    preHandler: [requirePermission("admin.access")]
  }, async (request, reply) => {
    try {
      const { matches } = await import("../db/schema.js");

      const [usersResult] = await db
        .select({ total: count() })
        .from(users)
        .where(eq(users.status, "active"));

      const [subsResult] = await db
        .select({ total: count(), mrr: sum(subscriptions.amount) })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"));

      const [matchCount] = await db
        .select({ total: count() })
        .from(matches);

      const [reportsResult] = await db
        .select({ total: count() })
        .from(reports)
        .where(eq(reports.status, "pending"));

      const mrr = Number(subsResult?.mrr ?? 0) / 100;

      return reply.send({
        totalActiveUsers: Number(usersResult?.total ?? 0),
        activeSubscriptions: Number(subsResult?.total ?? 0),
        mrr,
        arr: mrr * 12,
        totalMatches: Number(matchCount?.total ?? 0),
        pendingReports: Number(reportsResult?.total ?? 0),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao carregar dashboard" });
    }
  });

  // =======================================================================
  // 2. LISTAR USUARIOS
  // =======================================================================

  fastify.get("/users", {
    preHandler: [requirePermission("users.view")]
  }, async (request, reply) => {
    const { limit = 20, offset = 0 } = request.query as {
      limit?: number;
      offset?: number;
    };

    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          profileType: users.profileType,
          status: users.status,
          createdAt: users.createdAt,
          displayName: profiles.displayName,
          city: profiles.city,
          state: profiles.state,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.id))
        .orderBy(desc(users.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar usuarios." });
    }
  });

  // =======================================================================
  // 3. ALTERAR STATUS DO USUARIO
  // =======================================================================

  fastify.put("/users/:id/status", {
    preHandler: [requirePermission("users.edit")]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as {
      status: "active" | "inactive" | "suspended" | "banned";
    };

    try {
      const result = await db
        .update(users)
        .set({ status, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({ id: users.id, email: users.email, status: users.status });

      if (!result.length) {
        return reply.status(404).send({ message: "Usuario nao encontrado." });
      }

      const userObj = request.user as any;
      await db.insert(auditLogs).values({
        adminId: userObj.sub,
        action: `update_user_status_${status}`,
        entity: "user",
        entityId: id,
        details: { newStatus: status },
      });

      return reply.send({ message: `Status atualizado para ${status}`, user: result[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao atualizar status do usuario." });
    }
  });

  // =======================================================================
  // 4. FICHA COMPLETA CDM DO USUARIO
  // =======================================================================

  fastify.get("/users/:id/crm", {
    preHandler: [requirePermission("users.view")]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));

      if (!user) return reply.status(404).send({ message: "Usuario nao encontrado." });

      // Assinaturas via Drizzle
      const userSubs = await db
        .select({
          id: subscriptions.id,
          planId: subscriptions.planId,
          status: subscriptions.status,
          amount: subscriptions.amount,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          createdAt: subscriptions.createdAt,
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, id))
        .orderBy(desc(subscriptions.createdAt));

      // Acessos especiais via Drizzle
      const specialAccess = await db
        .select({
          id: userSpecialAccess.id,
          accessType: userSpecialAccess.accessType,
          validUntil: userSpecialAccess.validUntil,
          isActive: userSpecialAccess.isActive,
          reason: userSpecialAccess.reason,
          createdAt: userSpecialAccess.createdAt,
        })
        .from(userSpecialAccess)
        .where(eq(userSpecialAccess.userId, id))
        .orderBy(desc(userSpecialAccess.createdAt));

      // Eventos financeiros via Drizzle
      const finances = await db
        .select({
          id: financialEvents.id,
          type: financialEvents.type,
          amountCents: financialEvents.amountCents,
          currency: financialEvents.currency,
          description: financialEvents.description,
          recordedAt: financialEvents.recordedAt,
        })
        .from(financialEvents)
        .where(eq(financialEvents.userId, id))
        .orderBy(desc(financialEvents.recordedAt));

      // Notas CRM via Drizzle com JOIN no autor
      const authorProfile = alias(profiles, "author_profile");
      const notes = await db
        .select({
          id: userCrmNotes.id,
          content: userCrmNotes.content,
          createdAt: userCrmNotes.createdAt,
          authorName: authorProfile.displayName,
        })
        .from(userCrmNotes)
        .leftJoin(authorProfile, eq(authorProfile.id, userCrmNotes.authorId))
        .where(eq(userCrmNotes.userId, id))
        .orderBy(desc(userCrmNotes.createdAt));

      return reply.send({
        user,
        profile: profile ?? null,
        subscriptions: userSubs,
        specialAccess,
        financialEvents: finances,
        crmNotes: notes,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar ficha CRM." });
    }
  });

  // =======================================================================
  // 5. FOTOS PENDENTES
  // =======================================================================

  fastify.get("/photos/pending", {
    preHandler: [requirePermission("photos.moderate")]
  }, async (request, reply) => {
    try {
      const pendingPhotos = await db
        .select({
          id: photos.id,
          userId: photos.userId,
          storagePath: photos.storagePath,
          isPrimary: photos.isPrimary,
          createdAt: photos.createdAt,
          displayName: profiles.displayName,
        })
        .from(photos)
        .innerJoin(profiles, eq(photos.userId, profiles.id))
        .where(eq(photos.status, "pending"))
        .orderBy(photos.createdAt);

      const MINIO_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000/sweet-photos";

      const formatted = pendingPhotos.map((row) => ({
        id: row.id,
        user_id: row.userId,
        display_name: row.displayName,
        is_primary: row.isPrimary,
        created_at: row.createdAt,
        url: `${MINIO_URL}/${row.storagePath}`,
      }));

      return reply.send(formatted);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar fotos pendentes." });
    }
  });

  // =======================================================================
  // 6. MODERACAO DE FOTO
  // =======================================================================

  fastify.put("/photos/:id/approval", {
    preHandler: [requirePermission("photos.moderate")]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approved } = request.body as { approved: boolean };
    const userObj = request.user as any;

    try {
      if (approved) {
        const result = await db
          .update(photos)
          .set({ status: "approved" })
          .where(eq(photos.id, id))
          .returning();

        if (!result.length) {
          return reply.status(404).send({ message: "Foto nao encontrada." });
        }

        await db.insert(auditLogs).values({
          adminId: userObj.sub,
          action: "approve_photo",
          entity: "photo",
          entityId: id,
          details: { status: "approved" },
        });

        return reply.send({ message: "Foto aprovada com sucesso.", photo: result[0] });
      }

      const result = await db.delete(photos).where(eq(photos.id, id)).returning();

      if (!result.length) {
        return reply.status(404).send({ message: "Foto nao encontrada." });
      }

      await db.insert(auditLogs).values({
        adminId: userObj.sub,
        action: "reject_photo",
        entity: "photo",
        entityId: id,
        details: { status: "rejected_and_deleted" },
      });

      return reply.send({ message: "Foto rejeitada e removida do sistema." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao moderar foto." });
    }
  });

  // =======================================================================
  // 7. RELATORIO DE DENUNCIAS
  // =======================================================================

  fastify.get("/reports", {
    preHandler: [requirePermission("reports.view")]
  }, async (request, reply: FastifyReply) => {
    const { status = "pending", limit = 20, offset = 0 } = request.query as {
      status?: "pending" | "resolved" | "dismissed";
      limit?: number;
      offset?: number;
    };

    try {
      const reporterProfile = alias(profiles, "reporter_profile");
      const reportedProfile = alias(profiles, "reported_profile");

      const result = await db
        .select({
          id: reports.id,
          reason: reports.reason,
          description: reports.description,
          status: reports.status,
          createdAt: reports.createdAt,
          resolutionNote: reports.resolutionNote,
          reporterId: reports.reporterId,
          reporterName: reporterProfile.displayName,
          reportedId: reports.reportedId.
          reportedName: reportedProfile.displayName,
        })
        .from(reports)
        .leftJoin(reporterProfile, eq(reporterProfile.id, reports.reporterId))
        .leftJoin(reportedProfile, eq(reportedProfile.id, reports.reportedId))
        .where(eq(reports.status, status as any))
        .orderBy(desc(reports.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const [totalResult] = await db
        .select({ total: count() })
        .from(reports)
        .where(eq(reports.status, status as any));

      return reply.send({
        data: result,
        total: Number(totalResult?.total ?? 0),
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar denuncias." });
    }
  });

  // =======================================================================
  // 8. RESOLVER / DISPENSAR UMA DENUNCIA
  // =======================================================================

  fastify.put("/reports/:id/resolve", {
    preHandler: [requirePermission("reports.resolve")]
  }, async (request, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { action, resolutionNote } = request.body as {
      action: "resolved" | "dismissed";
      resolutionNote?: string;
    };
    const adminUser = request.user as any;

    try {
      await db
        .update(reports)
        .set({
          status: action,
          resolvedBy: adminUser.sub,
          resolvedAt: new Date(),
          resolutionNote: resolutionNote ?? null,
        })
        .where(eq(reports.id, id));

      await db.insert(auditLogs).values({
        adminId: adminUser.sub,
        action: `report_${action}`,
        entity: "report",
        entityId: id,
        details: { resolutionNote },
      });

      return reply.send({ success: true, message: `Denuncia marcada como '${action}'.` });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao resolver denuncia." });
    }
  });

  // =======================================================================
  // 9. ANALVTICS MERAIS
  // =======================================================================

  fastify.get("/analytics", {
    preHandler: [requirePermission("finance.view")]
  }, async (request, reply: FastifyReply) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [newUsersResult] = await db
        .select({ total: count() })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo));

      const [premiumResult] = await db
        .select({ total: count() })
        .from(users)
        .where(and(eq(users.isPremium, true), eq(users.status, "active")));

      const [totalUsersResult] = await db
        .select({ total: count() })
        .from(users);

      const mrrByPlan = await db
        .select({
          planId: subscriptions.planId,
          qty: count(),
          totalCents: sum(subscriptions.amount),
        })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"))
        .groupBy(subscriptions.planId);

      const [churnResult] = await db
        .select({ total: count() })
        .from(subscriptions)
        .where(and(eq(subscriptions.status, "cancelled"), gte(subscriptions.updatedAt, thirtyDaysAgo)));

      const totalUsers = Number(totalUsersResult?.total ?? 0);
      const premiumUsers = Number(premiumResult?.total ?? 0);
      const conversionRate = totalUsers > 0
        ? ((premiumUsers / totalUsers) * 100).toFixed(2)
        : "0.00";

      return reply.send({
        newUsersLast30Days: Number(newUsersResult?.total ?? 0),
        totalUsers,
        premiumUsers,
        conversionRate: `${conversionRate}%`,
        churnLast30Days: Number(churnResult?.total ?? 0),
        mrrByPlan: mrrByPlan.map((row) => ({
          planId: row.planId,
          quantity: Number(row.qty),
          totalBRL: Number(row.totalCents ?? 0) / 100,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao gerar analytics." });
    }
  });

  // =======================================================================
  // 10. ALIASES: /approve e /ban
  // =======================================================================

  fastify.put("/users/:id/approve", {
    preHandler: [requirePermission("users.edit")]
  }, async (request, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const adminUser = request.user as any;
    try {
      await db.update(users).set({ status: "active", isVerified: true }).where(eq(users.id, id));
      await db.insert(auditLogs).values({
        adminId: adminUser.sub,
        action: "approve_user",
        entity: "user",
        entityId: id,
        details: {},
      });
      return reply.send({ success: true, message: "Usuario aprovado com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao aprovar usuario." });
    }
  });

  fastify.put("/users/:id/ban", {
    preHandler: [requirePermission("users.ban")]
  }, async (request, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const adminUser = request.user as any;
    try {
      await db.update(users).set({ status: "banned" }).where(eq(users.id, id));
      await db.insert(auditLogs).values({
        adminId: adminUser.sub,
        action: "ban_user",
        entity: "user",
        entityId: id,
        details: {},
      });
      return reply.send({ success: true, message: "Usuario banido com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao banir usuario." });
    }
  });

  // =======================================================================
  // 11. MODERATION QUEUE
  // =======================================================================

  fastify.get("/moderation/pending", {
    preHandler: [requirePermission("users.view")]
  }, async (request, reply) => {
    try {
      const result = await db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
          birthDate: profiles.birthDate,
          gender: profiles.gender,
          relationshipType: profiles.relationshipType,
          state: profiles.state,
          city: profiles.city,
          bio: profiles.bio,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.moderationStatus, "pending"))
        .orderBy(desc(profiles.createdAt));

      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao carregar fila de moderacao." });
    }
  });

  fastify.post("/moderation/:profileId/approve", {
    preHandler: [requirePermission("users.edit")]
  }, async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    const adminUser = request.user as any;
    try {
      const { ModerationService } = await import("../services/moderation.service.js");
      await ModerationService.approveProfile(profileId, adminUser.sub);
      await db.insert(auditLogs).values({
        adminId: adminUser.sub,
        action: "approve_profile",
        entity: "profile",
        entityId: profileId,
        details: {},
      });
      return reply.send({ success: true, message: "Perfil aprovado com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao aprovar perfil." });
    }
  });

  fastify.post("/moderation/:profileId/reject", {
    preHandler: [requirePermission("users.edit")]
  }, async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    const { reason } = request.body as { reason: string };
    const adminUser = request.user as any;

    if (!reason || reason.trim() === "") {
      return reply.status(400).send({ message: "Motivo da rejeicao e obrigatorio." });
    }

    try {
      const { ModerationService } = await import("../services/moderation.service.js");
      await ModerationService.rejectProfile(profileId, reason, adminUser.sub);
      await db.insert(auditLogs).values({
        adminId: adminUser.sub,
        action: "reject_profile",
        entity: "profile",
        entityId: profileId,
        details: { reason },
      });
      return reply.send({ success: true, message: "Perfil rejeitado com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao rejeitar perfil." });
    }
  });
};