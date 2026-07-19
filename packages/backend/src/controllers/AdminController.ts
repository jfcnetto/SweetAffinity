import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  users,
  profiles,
  photos,
  reports,
  auditLogs,
  adminUsers,
  subscriptions,
  profileModerationQueue,
  userSpecialAccess,
} from "../db/schema.js";
import { eq, desc, count, and, isNull, gte, lte } from "drizzle-orm";

// =============================================================================
// GUARD: verifica se o usuário é admin ou moderador
// =============================================================================

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify();
  const user = request.user as { sub: string };
  const [dbUser] = await db
    .select({ profileType: users.profileType })
    .from(users)
    .where(eq(users.id, user.sub));
  if (!dbUser || (dbUser.profileType !== "admin" && dbUser.profileType !== "moderator")) {
    reply.status(403).send({ message: "Acesso negado." });
    throw new Error("Forbidden");
  }
  return user.sub;
}

// =============================================================================
// ADMIN ROUTES
// =============================================================================

export const adminRoutes = async (fastify: FastifyInstance) => {

  // GET /admin/health
  fastify.get("/health", async () => ({ status: "ok" }));

  // =============================================================================
  // GET /admin/dashboard — Métricas gerais
  // =============================================================================
  fastify.get("/dashboard", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAdmin(request, reply);

      const [totalUsers] = await db.select({ value: count() }).from(users);
      const [totalActive] = await db.select({ value: count() }).from(users).where(eq(users.status, "active"));
      const [totalPremium] = await db.select({ value: count() }).from(users).where(eq(users.isPremium, true));
      const [totalPendingPhotos] = await db.select({ value: count() }).from(photos).where(eq(photos.status, "pending"));
      const [totalPendingReports] = await db.select({ value: count() }).from(reports).where(eq(reports.status, "pending"));
      const [totalSubs] = await db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active"));
      const [totalPendingProfiles] = await db.select({ value: count() }).from(profileModerationQueue).where(eq(profileModerationQueue.status, "pending"));

      return reply.send({
        totalUsers: totalUsers.value,
        activeUsers: totalActive.value,
        premiumUsers: totalPremium.value,
        pendingPhotos: totalPendingPhotos.value,
        pendingReports: totalPendingReports.value,
        activeSubscriptions: totalSubs.value,
        pendingProfiles: totalPendingProfiles.value,
      });
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao buscar dashboard." });
    }
  });

  // =============================================================================
  // GET /admin/users — Listagem de usuários com paginação
  // =============================================================================
  fastify.get("/users", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAdmin(request, reply);
      const { page = "1", limit = "20" } = request.query as any;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, parseInt(limit));
      const offset = (pageNum - 1) * limitNum;

      const result = await db
        .select({
          id: users.id,
          email: users.email,
          profileType: users.profileType,
          status: users.status,
          isVerified: users.isVerified,
          isPremium: users.isPremium,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          displayName: profiles.displayName,
          relationshipType: profiles.relationshipType,
          city: profiles.city,
          state: profiles.state,
          primaryPhotoPath: photos.storagePath,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.id))
        .leftJoin(photos, and(eq(users.id, photos.userId), eq(photos.isPrimary, true)))
        .orderBy(desc(users.createdAt))
        .limit(limitNum)
        .offset(offset);

      const MINIO_URL = process.env.MINIO_PUBLIC_URL || "https://pub-965c3dcee438453785ccea7e90c84b6b.r2.dev";
      const mapped = result.map((r) => ({
        ...r,
        primaryPhotoUrl: r.primaryPhotoPath ? `${MINIO_URL}/${r.primaryPhotoPath}` : null,
      }));

      return reply.send({ data: mapped, page: pageNum, limit: limitNum });
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao listar usuários." });
    }
  });

  // =============================================================================
  // PATCH /admin/users/:id/status — Alterar status do usuário
  // =============================================================================
  fastify.patch("/users/:id/status", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      const [updated] = await db
        .update(users)
        .set({ status: status as any })
        .where(eq(users.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ message: "Usuário não encontrado." });

      await db.insert(auditLogs).values({
        adminId,
        action: "update_user_status",
        entity: "user",
        entityId: id,
        details: { newStatus: status },
      });

      return reply.send(updated);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao atualizar status." });
    }
  });

  // =============================================================================
  // PATCH /admin/users/:id/premium — Conceder/Remover Premium
  // =============================================================================
  fastify.patch("/users/:id/premium", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };
      const { isPremium } = request.body as { isPremium: boolean };

      const [updated] = await db
        .update(users)
        .set({ isPremium })
        .where(eq(users.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ message: "Usuário não encontrado." });

      await db.insert(auditLogs).values({
        adminId,
        action: "update_user_premium",
        entity: "user",
        entityId: id,
        details: { isPremium },
      });

      return reply.send(updated);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao atualizar premium." });
    }
  });

  // =============================================================================
  // POST /admin/users/:id/special-access — Conceder Acesso Especial (ex: Vitalício)
  // =============================================================================
  fastify.post("/users/:id/special-access", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };
      const { accessType, reason, validUntil } = request.body as {
        accessType: 'lifetime' | 'free_premium' | 'vip' | 'tester' | 'influencer';
        reason?: string;
        validUntil?: string | null;
      };

      const [special] = await db
        .insert(userSpecialAccess)
        .values({
          userId: id,
          accessType,
          reason: reason || "Concedido pelo Administrador",
          grantedBy: adminId,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: true,
        })
        .returning();

      // Se for vitalício ou free_premium, ativa o flag isPremium do usuário também
      if (accessType === "lifetime" || accessType === "free_premium" || accessType === "vip") {
        await db.update(users).set({ isPremium: true }).where(eq(users.id, id));
      }

      await db.insert(auditLogs).values({
        adminId,
        action: "grant_special_access",
        entity: "user",
        entityId: id,
        details: { accessType, reason },
      });

      return reply.status(201).send(special);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao conceder acesso especial." });
    }
  });

  // =============================================================================
  // GET /admin/photos/pending — Fila de moderação de fotos
  // =============================================================================
  fastify.get("/photos/pending", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAdmin(request, reply);

      const pending = await db
        .select({
          id: photos.id,
          storagePath: photos.storagePath,
          type: photos.type,
          createdAt: photos.createdAt,
          userId: photos.userId,
          displayName: profiles.displayName,
        })
        .from(photos)
        .leftJoin(profiles, eq(photos.userId, profiles.id))
        .where(eq(photos.status, "pending"))
        .orderBy(desc(photos.createdAt));

      const MINIO_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000/sweetaffinity-media";
      const result = pending.map((p) => ({
        ...p,
        url: `${MINIO_URL}/${p.storagePath}`,
      }));

      return reply.send(result);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao buscar fotos pendentes." });
    }
  });

  // =============================================================================
  // PATCH /admin/photos/:id/status — Aprovar/Rejeitar foto
  // =============================================================================
  fastify.patch("/photos/:id/status", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: "pending" | "approved" | "rejected" };

      const [updated] = await db
        .update(photos)
        .set({ status })
        .where(eq(photos.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ message: "Foto não encontrada." });

      await db.insert(auditLogs).values({
        adminId,
        action: `${status}_photo`,
        entity: "photo",
        entityId: id,
        details: { status },
      });

      return reply.send(updated);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao atualizar foto." });
    }
  });

  // =============================================================================
  // GET /admin/moderation/profiles — Fila de moderação de perfis
  // =============================================================================
  fastify.get("/moderation/profiles", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAdmin(request, reply);
      const { status = "pending" } = request.query as any;

      const result = await db
        .select({
          id: profileModerationQueue.id,
          profileId: profileModerationQueue.profileId,
          status: profileModerationQueue.status,
          createdAt: profileModerationQueue.createdAt,
          reviewedAt: profileModerationQueue.reviewedAt,
          reviewedBy: profileModerationQueue.reviewedBy,
          rejectionReason: profileModerationQueue.rejectionReason,
          displayName: profiles.displayName,
          bio: profiles.bio,
          relationshipType: profiles.relationshipType,
        })
        .from(profileModerationQueue)
        .leftJoin(profiles, eq(profileModerationQueue.profileId, profiles.id))
        .where(eq(profileModerationQueue.status, status as any))
        .orderBy(desc(profileModerationQueue.createdAt));

      return reply.send(result);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao buscar fila de perfis." });
    }
  });

  // =============================================================================
  // POST /admin/moderation/:id/approve — Aprovar perfil
  // =============================================================================
  fastify.post("/moderation/:id/approve", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };

      const [queue] = await db
        .select()
        .from(profileModerationQueue)
        .where(eq(profileModerationQueue.id, id));

      if (!queue) return reply.status(404).send({ message: "Item de moderação não encontrado." });

      const [updated] = await db
        .update(profileModerationQueue)
        .set({ status: "approved", reviewedBy: adminId, reviewedAt: new Date() })
        .where(eq(profileModerationQueue.id, id))
        .returning();

      await db.insert(auditLogs).values({
        adminId,
        action: "approve_profile",
        entity: "profile_moderation_queue",
        entityId: id,
        details: { profileId: queue.profileId },
      });

      return reply.send({ success: true, item: updated });
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao aprovar perfil." });
    }
  });

  // =============================================================================
  // POST /admin/moderation/:id/reject — Rejeitar perfil
  // =============================================================================
  fastify.post("/moderation/:id/reject", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason?: string };

      const [queue] = await db
        .select()
        .from(profileModerationQueue)
        .where(eq(profileModerationQueue.id, id));

      if (!queue) return reply.status(404).send({ message: "Item de moderação não encontrado." });

      const [updated] = await db
        .update(profileModerationQueue)
        .set({
          status: "rejected",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason ?? "Perfil não atende às diretrizes da plataforma.",
        })
        .where(eq(profileModerationQueue.id, id))
        .returning();

      await db.insert(auditLogs).values({
        adminId,
        action: "reject_profile",
        entity: "profile_moderation_queue",
        entityId: id,
        details: { profileId: queue.profileId, reason },
      });

      return reply.send({ success: true, item: updated });
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao rejeitar perfil." });
    }
  });

  // =============================================================================
  // GET /admin/reports — Listagem de denúncias
  // =============================================================================
  fastify.get("/reports", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAdmin(request, reply);
      const { status = "pending" } = request.query as any;

      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.status, status as any))
        .orderBy(desc(reports.createdAt));

      return reply.send(result);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao buscar denúcias." });
    }
  });

  // =============================================================================
  // PATCH /admin/reports/:id/resolve — Resolver denúncia
  // =============================================================================
  fastify.patch("/reports/:id/resolve", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = await requireAdmin(request, reply);
      const { id } = request.params as { id: string };
      const { status, resolutionNote } = request.body as any;

      const [updated] = await db
        .update(reports)
        .set({ status, resolutionNote, resolvedBy: adminId, resolvedAt: new Date() })
        .where(eq(reports.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ message: "Denúncia não encontrada." });

      await db.insert(auditLogs).values({
        adminId,
        action: "resolve_report",
        entity: "report",
        entityId: id,
        details: { status, resolutionNote },
      });

      return reply.send(updated);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao resolver denúncia." });
    }
  });

  // =============================================================================
  // GET /admin/audit — Logs de auditoria
  // =============================================================================
  fastify.get("/audit", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAdmin(request, reply);
      const { page = "1", limit = "50" } = request.query as any;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, parseInt(limit));

      const result = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limitNum)
        .offset((pageNum - 1) * limitNum);

      return reply.send(result);
    } catch (error) {
      if (!reply.sent) return reply.status(500).send({ message: "Erro ao buscar logs." });
    }
  });
};
