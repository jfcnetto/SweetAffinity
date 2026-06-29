import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { users, profiles } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";

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
        id: string;
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
      status: "active" | "blocked" | "deleted";
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
      const photos = await db.execute(sql`
        SELECT 
          ph.id,
          ph.user_id,
          ph.storage_path,
          ph.is_primary,
          ph.created_at,
          p.display_name
        FROM photos ph
        INNER JOIN profiles p ON ph.user_id = p.id
        WHERE ph.is_approved = false
        ORDER BY ph.created_at ASC
      `);

      const MINIO_URL =
        process.env.MINIO_PUBLIC_URL ||
        "http://localhost:9000/sweet-photos";

      const formatted = photos.rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        display_name: row.display_name,
        is_primary: row.is_primary,
        created_at: row.created_at,
        url: `${MINIO_URL}/${row.storage_path}`,
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
      if (approved) {
        const result = await db
          .update(photos)
          .set({
            isApproved: true,
            updatedAt: new Date(),
          })
          .where(eq(photos.id, id))
          .returning();

        if (!result.length) {
          return reply.status(404).send({
            message: "Foto não encontrada.",
          });
        }

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

      return reply.send({
        message:
          "Foto rejeitada e removida do sistema.",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        message: "Erro ao moderar foto.",
      });
    }
  });
};