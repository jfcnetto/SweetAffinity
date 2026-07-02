import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { eq, ne, and } from "drizzle-orm";

// =====================================================
// PROFILE ROUTES
// =====================================================

export const profileRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as {
          id: string;
          profileType: "user" | "admin";
          relationshipType?: "baby" | "sugar_daddy" | "sugar_mommy";
        };

        // =====================================================
        // MATCHMAKING LOGIC (BUSINESS RULE)
        // =====================================================

        // Baby vê Daddies/Mommies
        // Daddies/Mommies veem Babies

        let targetTypes: string[] = [];

        if (user.relationshipType === "baby") {
          targetTypes = ["sugar_daddy", "sugar_mommy"];
        } else {
          targetTypes = ["baby"];
        }

        // =====================================================
        // QUERY (DRIZZLE SAFE)
        // =====================================================

        const result = await db
          .select()
          .from(profiles)
          .where(
            and(
              ne(profiles.id, user.id) // não mostrar próprio perfil
            )
          )
          .limit(50);

        // =====================================================
        // FILTER BUSINESS SIDE
        // =====================================================

        const filtered = result.filter((profile) =>
          targetTypes.includes(profile.relationshipType as any)
        );

        return reply.send(filtered);
      } catch (error) {
        fastify.log.error(error);

        return reply.status(500).send({
          message: "Erro ao buscar perfis.",
        });
      }
    }
  );

  // =====================================================
  // UPDATE PROFILE (RN-007: Autorização de edição)
  // =====================================================

  fastify.put(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { id: string };
        const { id: targetId } = request.params as { id: string };

        // Validação de segurança: apenas o dono pode editar (RN-007)
        if (targetId !== user.id) {
          return reply.status(403).send({ message: "Você não tem permissão para editar este perfil." });
        }

        const data = request.body as any;

        // Validação: profile_type é imutável (RN-003)
        if (data.profileType) {
          return reply.status(422).send({ message: "O tipo de perfil não pode ser alterado." });
        }

        const [updatedProfile] = await db
          .update(profiles)
          .set(data)
          .where(eq(profiles.id, targetId))
          .returning();

        if (!updatedProfile) {
          return reply.status(404).send({ message: "Perfil não encontrado." });
        }

        return reply.send(updatedProfile);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao atualizar perfil." });
      }
    }
  );
};