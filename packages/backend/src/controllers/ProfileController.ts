import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { profiles, users } from "../db/schema.js";
import { eq, ne, and, isNull } from "drizzle-orm";
import { ProfileService } from "../modules/profile/profiles.service.js";

// =====================================================
// PROFILE ROUTES
// =====================================================

export const profileRoutes = async (fastify: FastifyInstance) => {

  // =====================================================
  // GET /profiles — Listagem com matchmaking por profileType
  // Baby vê Daddies/Mommies; Daddies/Mommies veem Babies
  // =====================================================

  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as { sub: string };
        const { page = "1", limit = "20" } = request.query as {
          page?: string;
          limit?: string;
        };

        // Busca o tipo de relacionamento do usuário autenticado (matchmaking)
        const [currentUser] = await db
          .select({ relationshipType: profiles.relationshipType })
          .from(profiles)
          .where(eq(profiles.id, user.sub));

        if (!currentUser) {
          return reply.status(404).send({ message: "Usuário não encontrado." });
        }

        // =====================================================
        // MATCHMAKING: Baby vê Daddy/Mommy e vice-versa
        // =====================================================
        let targetRelationshipType: "baby" | "daddy" | "mommy" | null = null;

        if (currentUser.relationshipType === "baby") {
          // Baby vê todos os daddy e mommy — filtrar no resultado
          targetRelationshipType = null; // busca genérica, filtra abaixo
        } else if (
          currentUser.relationshipType === "daddy" ||
          currentUser.relationshipType === "mommy"
        ) {
          targetRelationshipType = "baby";
        }

        // JOIN profiles ← users para acessar profileType
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;

        const result = await db
          .select({
            id: profiles.id,
            displayName: profiles.displayName,
            birthDate: profiles.birthDate,
            gender: profiles.gender,
            state: profiles.state,
            city: profiles.city,
            bio: profiles.bio,
            profession: profiles.profession,
            education: profiles.education,
            incomeRange: profiles.incomeRange,
            maritalStatus: profiles.maritalStatus,
            heightRange: profiles.heightRange,
            ethnicity: profiles.ethnicity,
            hairColor: profiles.hairColor,
            eyeColor: profiles.eyeColor,
            smoking: profiles.smoking,
            drinking: profiles.drinking,
            seekingDescription: profiles.seekingDescription,
            popularityScore: profiles.popularityScore,
            profileViews: profiles.profileViews,
            createdAt: profiles.createdAt,
            // campos do user
            profileType: users.profileType, // user/admin
            relationshipType: profiles.relationshipType, // baby/daddy/mommy
            isPremium: users.isPremium,
          })
          .from(profiles)
          .innerJoin(users, eq(profiles.id, users.id))
          .where(
            and(
              ne(profiles.id, user.sub),        // não mostrar próprio perfil
              isNull(profiles.deletedAt),        // soft delete
              targetRelationshipType
                ? eq(profiles.relationshipType, targetRelationshipType)
                : undefined
            )
          )
          .limit(limitNum)
          .offset(offset);

        // Se for baby, filtra para ver apenas daddy e mommy
        const filtered =
          currentUser.relationshipType === "baby"
            ? result.filter(
                (p) => p.relationshipType === "daddy" || p.relationshipType === "mommy"
              )
            : result;

        return reply.send(filtered);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao buscar perfis." });
      }
    }
  );

  // =====================================================
  // GET /profiles/:id — Perfil público por ID
  // =====================================================

  fastify.get(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const { id } = request.params as { id: string };

        const [profile] = await db
          .select({
            id: profiles.id,
            displayName: profiles.displayName,
            birthDate: profiles.birthDate,
            gender: profiles.gender,
            state: profiles.state,
            city: profiles.city,
            bio: profiles.bio,
            profession: profiles.profession,
            education: profiles.education,
            incomeRange: profiles.incomeRange,
            maritalStatus: profiles.maritalStatus,
            heightRange: profiles.heightRange,
            ethnicity: profiles.ethnicity,
            hairColor: profiles.hairColor,
            eyeColor: profiles.eyeColor,
            smoking: profiles.smoking,
            drinking: profiles.drinking,
            seekingDescription: profiles.seekingDescription,
            popularityScore: profiles.popularityScore,
            profileViews: profiles.profileViews,
            createdAt: profiles.createdAt,
            profileType: users.profileType,
            relationshipType: profiles.relationshipType,
            isPremium: users.isPremium,
          })
          .from(profiles)
          .innerJoin(users, eq(profiles.id, users.id))
          .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)));

        if (!profile) {
          return reply.status(404).send({ message: "Perfil não encontrado." });
        }

        return reply.send(profile);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao buscar perfil." });
      }
    }
  );

  // =====================================================
  // POST /profiles — Criar ou atualizar perfil (upsert)
  // Usa ProfileService para imutabilidade de profileType (RN-003)
  // =====================================================

  fastify.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const data = request.body as any;

        const result = await ProfileService.upsertProfile(user.sub, data);

        return reply.status(201).send(result[0]);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(422).send({ message: error.message });
      }
    }
  );

  // =====================================================
  // PUT /profiles/:id — Atualizar perfil (RN-007)
  // Apenas o dono pode editar; profileType é imutável (RN-003)
  // =====================================================

  fastify.put(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const { id: targetId } = request.params as { id: string };

        // RN-007: apenas o dono pode editar
        if (targetId !== user.sub) {
          return reply.status(403).send({
            message: "Você não tem permissão para editar este perfil.",
          });
        }

        const data = request.body as any;

        // RN-003: relationshipType é imutável
        if (data.relationshipType) {
          return reply.status(422).send({
            message: "O tipo de relacionamento não pode ser alterado.",
          });
        }

        // Remove campos que não devem ser alterados via PUT
        const { id, createdAt, popularityScore, profileViews, deletedAt, ...updateData } = data;

        const [updatedProfile] = await db
          .update(profiles)
          .set({ ...updateData, updatedAt: new Date() })
          .where(and(eq(profiles.id, targetId), isNull(profiles.deletedAt)))
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

  // =====================================================
  // DELETE /profiles/:id — Soft delete (CA-P08)
  // =====================================================

  fastify.delete(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const { id: targetId } = request.params as { id: string };

        // RN-007: apenas o dono pode deletar o próprio perfil
        if (targetId !== user.sub) {
          return reply.status(403).send({
            message: "Você não tem permissão para excluir este perfil.",
          });
        }

        const [deletedProfile] = await db
          .update(profiles)
          .set({ deletedAt: new Date() })
          .where(and(eq(profiles.id, targetId), isNull(profiles.deletedAt)))
          .returning();

        if (!deletedProfile) {
          return reply.status(404).send({ message: "Perfil não encontrado." });
        }

        return reply.status(200).send({ message: "Perfil excluído com sucesso." });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao excluir perfil." });
      }
    }
  );
};