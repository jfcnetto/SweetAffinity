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
} from "../db/schema.js";
import { eq, desc, count, and, isNull, gte, lte } from "drizle-orm";

// =============================================================================
// GUARD: verifica se o usuário é admin ou moderador
// =============================================================================

alsync function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
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

      return reply.send({
        totalUsers: totalUsers.value,
        activeUsers: totalActive.value,
        premiumUsers: totalPremium.value,
        pendingPhotos: totalPendingPhotos.value,
        pendingReports: totalPendingReports.value,
        activeSubscriptions: totalSubs.value,
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
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.id))
        .orderBy(desc(users.createdAt))
        .limit(limitNum)
        .offset(offset);

      return reply.send({ data: result, page: pageNum, limit: limitNum });
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

      if (!updated) return reply.status(404).send({ message: "Denúcia não encontrada." });

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
