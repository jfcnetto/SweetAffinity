import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { users, profiles, photos, reports, auditLogs, subscriptions } from "../db/schema.js";
import { eq, desc, sql, and, sum, count } from "drizzle-orm";
import { requirePermission } from "../middleware/rbac.js";

// =====================================================
// ADMIN ROUTES
// =====================================================

export const adminRoutes = async (fastify: FastifyInstance) => {
  // =====================================================
  // 1. DASHBOARD & KPIs
  // =====================================================

  fastify.get("/dashboard", async (request, reply) => {
    try {
      const usersResult = await db.execute(sql`
        SELECT count(*) as total FROM users WHERE status = 'active'
      `);
      
      const subsResult = await db.execute(sql`
        SELECT count(*) as total, SUM(amount) as mrr FROM subscriptions WHERE status = 'active'
      `);
      
      const matchResult = await db.execute(sql`
        SELECT count(*) as total FROM matches
      `);
      
      const reportsResult = await db.execute(sql`
        SELECT count(*) as total FROM reports WHERE status = 'pending'
      `);
      
      const mrr = Number(subsResult.rows[0]?.mrr ?? 0) / 100;
      
      return reply.send({
        totalActiveUsers: Number(usersResult.rows[0]?.total ?? 0),
        activeSubscriptions: Number(subsResult.rows[0]?.total ?? 0),
        mrr,
        arr: mrr * 12,
        totalMatches: Number(matchResult.rows[0]?.total ?? 0),
        pendingReports: Number(reportsResult.rows[0]?.total ?? 0),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao carregar dashboard" });
    }
  });

  // =====================================================
  // 2. LISTAR USUÁRIOS
  // =====================================================

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
      return reply.status(500).send({
        message: "Erro ao listar usuários.",
      });
    }
  });

  // =====================================================
  // 2. ALTERAR STATUS DO USUÁRIO
  // =====================================================

  fastify.put("/users/:id/status", {
    preHandler: [requirePermission("users.edit")] // Assume edit is required. For ban, there is a specific route.
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as {
      status: "active" | "inactive" | "suspended" | "banned";
    };

    try {
      const result = await db
        .update(users)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          status: users.status,
        });

      if (!result.length) {
        return reply.status(404).send({
          message: "Usuário não encontrado.",
        });
      }

      // Adicionando Log de Auditoria
      const userObj = request.user as any;
      const { auditLogs } = await import("../db/schema.js");
      await db.insert(auditLogs).values({
        adminId: userObj.sub,
        action: `update_user_status_${status}`,
        entity: "user",
        entityId: id,
        details: { previousStatus: "unknown", newStatus: status }
      });

      return reply.send({
        message: `Status atualizado para ${status}`,
        user: result[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        message: "Erro ao atualizar status do usuário.",
      });
    }
  });

  // =====================================================
  // 3. FICHA COMPLETA CRM DO USUÁRIO
  // =====================================================

  fastify.get("/users/:id/crm", {
    preHandler: [requirePermission("users.view")]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Básico
      const [user] = await db.select().from(users).where(eq(users.id, id));
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
      
      if (!user) return reply.status(404).send({ message: "Usuário não encontrado." });

      // Assinaturas
      const userSubs = await db.execute(sql`
        SELECT id, plan_id, status, amount, current_period_end, created_at 
        FROM subscriptions WHERE user_id = ${id} ORDER BY created_at DESC
      `);

      // Acessos especiais (Vitalício, Free Premium, VIP)
      const specialAccess = await db.execute(sql`
        SELECT id, access_type, valid_until, is_active, reason, created_at 
        FROM user_special_access WHERE user_id = ${id} ORDER BY created_at DESC
      `);

      // Eventos Financeiros
      const finances = await db.execute(sql`
        SELECT id, type, amount_cents, currency, description, recorded_at 
        FROM financial_events WHERE user_id = ${id} ORDER BY recorded_at DESC
      `);

      // Notas de CRM
      const notes = await db.execute(sql`
        SELECT n.id, n.content, n.created_at, p.display_name AS author_name 
        FROM user_crm_notes n 
        LEFT JOIN profiles p ON p.id = n.author_id 
        WHERE n.user_id = ${id} ORDER BY n.created_at DESC
      `);

      return reply.send({
        user,
        profile: profile ?? null,
        subscriptions: userSubs.rows,
        specialAccess: specialAccess.rows,
        financialEvents: finances.rows,
        crmNotes: notes.rows,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar ficha CRM." });
    }
  });

  // =====================================================
  // 4. FOTOS PENDENTES
  // =====================================================

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

      const MINIO_URL =
        process.env.MINIO_PUBLIC_URL ||
        "http://localhost:9000/sweet-photos";

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
      return reply.status(500).send({
        message: "Erro ao listar fotos pendentes.",
      });
    }
  });

  // =====================================================
  // 4. MODERAÇÃO DE FOTO
  // =====================================================

  fastify.put("/photos/:id/approval", {
    preHandler: [requirePermission("photos.moderate")]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approved } = request.body as { approved: boolean };

    try {
      const userObj = request.user as any;
      const { auditLogs } = await import("../db/schema.js");

      if (approved) {
        const result = await db
          .update(photos)
          .set({
            status: "approved",
          })
          .where(eq(photos.id, id))
          .returning();

        if (!result.length) {
          return reply.status(404).send({
            message: "Foto não encontrada.",
          });
        }

        // Log de Auditoria
        await db.insert(auditLogs).values({
          adminId: userObj.sub,
          action: "approve_photo",
          entity: "photo",
          entityId: id,
          details: { status: "approved" }
        });

        return reply.send({
          message: "Foto aprovada com sucesso.",
          photo: result[0],
        });
      }

      const result = await db
        .delete(photos)
        .where(eq(photos.id, id))
        .returning();

      if (!result.length) {
        return reply.status(404).send({
          message: "Foto não encontrada.",
        });
      }

      // Log de Auditoria
      await db.insert(auditLogs).values({
        adminId: userObj.sub,
        action: "reject_photo",
        entity: "photo",
        entityId: id,
        details: { status: "rejected_and_deleted" }
      });

      return reply.send({
        message: "Foto rejeitada e removida do sistema.",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        message: "Erro ao moderar foto.",
      });
    }
  });

  // =====================================================
  // 6. RELATÓRIO DE DENÚNCIAS (REPORTS)
  // Spec: GET /admin/reports — Admin JWT Token
  // Seção 6.1: Central de denúncias categorizadas por gravidade e cronologia
  // =====================================================

  fastify.get("/reports", {
    preHandler: [requirePermission("reports.view")]
  }, async (request, reply: FastifyReply) => {
    const { status = "pending", limit = 20, offset = 0 } = request.query as {
      status?: "pending" | "resolved" | "dismissed";
      limit?: number;
      offset?: number;
    };

    try {
      const result = await db.execute(sql`
        SELECT
          r.id,
          r.reason,
          r.description,
          r.status,
          r.created_at,
          r.resolution_note,
          reporter.id   AS reporter_id,
          rp_reporter.display_name AS reporter_name,
          reported.id   AS reported_id,
          rp_reported.display_name AS reported_name
        FROM reports r
        JOIN users reporter  ON r.reporter_id = reporter.id
        JOIN users reported  ON r.reported_id = reported.id
        LEFT JOIN profiles rp_reporter ON rp_reporter.id = reporter.id
        LEFT JOIN profiles rp_reported ON rp_reported.id = reported.id
        WHERE r.status = ${status}
        ORDER BY r.created_at DESC
        LIMIT ${Number(limit)}
        OFFSET ${Number(offset)}
      `);

      const totalResult = await db.execute(
        sql`SELECT count(*) FROM reports WHERE status = ${status}`
      );

      return reply.send({
        data: result.rows,
        total: Number(totalResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar denúncias." });
    }
  });

  // =====================================================
  // 7. RESOLVER / DISPENSAR UMA DENÚNCIA
  // Spec: Admin deve poder aplicar punições e registrar resolução
  // =====================================================

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

      // Log de auditoria
      await db.insert(auditLogs).values({
        adminId: adminUser.sub,
        action: `report_${action}`,
        entity: "report",
        entityId: id,
        details: { resolutionNote },
      });

      return reply.send({ success: true, message: `Denúncia marcada como '${action}'.` });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao resolver denúncia." });
    }
  });

  // =====================================================
  // 8. ANALYTICS GERAIS
  // Spec: GET /admin/analytics — Admin JWT Token
  // Seção 6.2: KPIs (MRR, Churn, Conversão, etc.)
  // =====================================================

  fastify.get("/analytics", {
    preHandler: [requirePermission("finance.view")]
  }, async (request, reply: FastifyReply) => {
    try {
      // Novos usuários nos últimos 30 dias
      const newUsersResult = await db.execute(sql`
        SELECT count(*) FROM users
        WHERE created_at >= now() - interval '30 days'
      `);

      // Usuários premium ativos
      const premiumResult = await db.execute(sql`
        SELECT count(*) FROM users WHERE is_premium = true AND status = 'active'
      `);

      // Total de usuários
      const totalUsersResult = await db.execute(sql`SELECT count(*) FROM users`);

      // MRR detalhado por plano
      const mrrByPlanResult = await db.execute(sql`
        SELECT plan_id, count(*) as qty, sum(amount) as total_cents
        FROM subscriptions
        WHERE status = 'active'
        GROUP BY plan_id
      `);

      // Taxa de conversão (Free -> Premium)
      const totalUsers = Number(totalUsersResult.rows[0].count);
      const premiumUsers = Number(premiumResult.rows[0].count);
      const conversionRate = totalUsers > 0
        ? ((premiumUsers / totalUsers) * 100).toFixed(2)
        : "0.00";

      // Cancelamentos (churn) nos últimos 30 dias
      const churnResult = await db.execute(sql`
        SELECT count(*) FROM subscriptions
        WHERE status = 'cancelled'
        AND updated_at >= now() - interval '30 days'
      `);

      return reply.send({
        newUsersLast30Days: Number(newUsersResult.rows[0].count),
        totalUsers,
        premiumUsers,
        conversionRate: `${conversionRate}%`,
        churnLast30Days: Number(churnResult.rows[0].count),
        mrrByPlan: mrrByPlanResult.rows.map((row: any) => ({
          planId: row.plan_id,
          quantity: Number(row.qty),
          totalBRL: Number(row.total_cents) / 100,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao gerar analytics." });
    }
  });

  // =====================================================
  // 9. ALIASES: /approve e /ban (Spec: PUT /admin/users/:id/approve + ban)
  // =====================================================

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
      return reply.send({ success: true, message: "Usuário aprovado com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao aprovar usuário." });
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
      return reply.send({ success: true, message: "Usuário banido com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao banir usuário." });
    }
  });

  // =====================================================
  // 10. MODERATION QUEUE (Passo 2 e 7)
  // =====================================================

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
      return reply.status(500).send({ message: "Erro ao carregar fila de moderação." });
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
      return reply.status(400).send({ message: "Motivo da rejeição é obrigatório." });
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