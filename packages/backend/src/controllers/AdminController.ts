import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { users, profiles, photos } from "../db/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";

// =====================================================
// ADMIN ROUTES
// =====================================================

export const adminRoutes = async (fastify: FastifyInstance) => {
  // =====================================================
  // AUTH MIDDLEWARE
  // =====================================================

  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();

      const user = request.user as {
        sub: string;
        profileType?: string;
      };

      if (user.profileType !== "admin") {
        return reply.status(403).send({
          message:
            "Acesso negado. Recurso exclusivo para administradores.",
        });
      }
    } catch {
      return reply.status(401).send({
        message: "Sessão inválida ou expirada.",
      });
    }
  });

  // =====================================================
  // 1. LISTAR USUÁRIOS
  // =====================================================

  fastify.get("/users", async (request, reply) => {
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

  fastify.put("/users/:id/status", async (request, reply) => {
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
      import { auditLogs } from "../db/schema.js";
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
  // 3. FOTOS PENDENTES
  // =====================================================

  fastify.get("/photos/pending", async (request, reply) => {
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

  fastify.put("/photos/:id/approval", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approved } = request.body as { approved: boolean };

    try {
      const userObj = request.user as any;
      import { auditLogs } from "../db/schema.js";

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
  // 5. DASHBOARD FINANCEIRO E KPIS
  // =====================================================

  fastify.get("/dashboard", async (request, reply) => {
    try {
      // 1. Contagem de usuários ativos
      const usersResult = await db.execute(sql`SELECT count(*) FROM users WHERE status = 'active'`);
      const totalActiveUsers = usersResult.rows[0].count;

      // 2. Cálculo do MRR (Mensal Recorrente) e Assinaturas Ativas
      const subsResult = await db.execute(sql`
        SELECT count(*) as active_subs, sum(amount) as mrr_cents 
        FROM subscriptions 
        WHERE status = 'active'
      `);
      const activeSubs = subsResult.rows[0].active_subs;
      const mrr = subsResult.rows[0].mrr_cents ? Number(subsResult.rows[0].mrr_cents) / 100 : 0;
      
      // ARR (Annual Recurring Revenue)
      const arr = mrr * 12;

      // 3. Contagem de Matches (Engajamento)
      const matchesResult = await db.execute(sql`SELECT count(*) FROM matches`);
      const totalMatches = matchesResult.rows[0].count;

      return reply.send({
        totalActiveUsers: Number(totalActiveUsers),
        activeSubscriptions: Number(activeSubs),
        mrr,
        arr,
        totalMatches: Number(totalMatches)
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        message: "Erro ao gerar KPIs do Dashboard.",
      });
    }
  });
};