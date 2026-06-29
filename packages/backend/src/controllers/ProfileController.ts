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
};