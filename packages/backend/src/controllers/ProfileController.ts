import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { profiles, users, photos } from "../db/schema.js";
import { eq, ne, and, isNull } from "drizzle-orm";
import { ProfileService } from "../modules/profile/profiles.service.js";

// Helper functions for advanced matchmaking filter parameters
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getAge(birthDateString: string | Date) {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function parseHeightCm(heightStr: string | null | undefined): number | null {
  if (!heightStr) return null;
  const match = heightStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  if (val < 3) {
    return Math.round(val * 100); // 1.75 -> 175
  }
  return Math.round(val);
}

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
        const {
          page = "1",
          limit = "20",
          maritalStatus,
          state,
          city,
          height,
          ethnicity,
          hairColor,
          eyeColor,
          smoking,
          drinking,
          education,
          partnershipType,
          meetingFrequency,
          radius,
          ageMin,
          ageMax,
          heightMin,
          heightMax,
        } = request.query as any;

        // Busca o tipo de relacionamento do usuário autenticado (matchmaking)
        const [currentUser] = await db
          .select({ 
            relationshipType: profiles.relationshipType,
            latitude: profiles.latitude,
            longitude: profiles.longitude
          })
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
          targetRelationshipType = null;
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

        const conditions = [
          ne(profiles.id, user.sub),        // não mostrar próprio perfil
          isNull(profiles.deletedAt),        // soft delete
          eq(profiles.moderationStatus, "approved"), // moderação aprovada apenas
        ];

        if (targetRelationshipType) {
          conditions.push(eq(profiles.relationshipType, targetRelationshipType));
        }

        // Filtros avançados opcionais (Passo 7)
        if (maritalStatus) conditions.push(eq(profiles.maritalStatus, maritalStatus));
        if (state) conditions.push(eq(profiles.state, state));
        if (city) conditions.push(eq(profiles.city, city));
        if (height) conditions.push(eq(profiles.heightRange, height));
        if (ethnicity) conditions.push(eq(profiles.ethnicity, ethnicity));
        if (hairColor) conditions.push(eq(profiles.hairColor, hairColor));
        if (eyeColor) conditions.push(eq(profiles.eyeColor, eyeColor));
        if (smoking) conditions.push(eq(profiles.smoking, smoking));
        if (drinking) conditions.push(eq(profiles.drinking, drinking));
        if (education) conditions.push(eq(profiles.education, education));
        if (partnershipType) conditions.push(eq(profiles.partnershipType, partnershipType));
        if (meetingFrequency) conditions.push(eq(profiles.meetingFrequency, meetingFrequency));

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
            profileType: users.profileType,
            relationshipType: profiles.relationshipType,
            isPremium: users.isPremium,
            latitude: profiles.latitude,
            longitude: profiles.longitude,
          })
          .from(profiles)
          .innerJoin(users, eq(profiles.id, users.id))
          .where(and(...conditions))
          .limit(limitNum)
          .offset(offset);

        // Se for baby, filtra para ver apenas daddy e mommy
        let filtered =
          currentUser.relationshipType === "baby"
            ? result.filter(
                (p) => p.relationshipType === "daddy" || p.relationshipType === "mommy"
              )
            : result;

        // ✅ FILTRO DE DISTÂNCIA / RAIO
        if (radius && currentUser.latitude && currentUser.longitude) {
          const radiusNum = parseFloat(radius);
          filtered = filtered.filter(p => {
            if (!p.latitude || !p.longitude) return false;
            const dist = getDistanceKm(
              currentUser.latitude!,
              currentUser.longitude!,
              p.latitude,
              p.longitude
            );
            return dist <= radiusNum;
          });
        }

        // ✅ FILTRO DE IDADE
        if (ageMin || ageMax) {
          const min = ageMin ? parseInt(ageMin) : 18;
          const max = ageMax ? parseInt(ageMax) : 99;
          filtered = filtered.filter(p => {
            if (!p.birthDate) return false;
            const age = getAge(p.birthDate);
            return age >= min && age <= max;
          });
        }

        // ✅ FILTRO DE ALTURA
        if (heightMin || heightMax) {
          const min = heightMin ? parseInt(heightMin) : 0;
          const max = heightMax ? parseInt(heightMax) : 300;
          filtered = filtered.filter(p => {
            const hCm = parseHeightCm(p.heightRange);
            if (hCm === null) return true; // Se não estiver preenchido, deixa passar
            return hCm >= min && hCm <= max;
          });
        }

        // Resolve URLs de fotos primárias de forma dinâmica
        const MINIO_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000/sweetaffinity-media";
        const enrichedProfiles = await Promise.all(
          filtered.map(async (p) => {
            const [pPhoto] = await db
              .select({ storagePath: photos.storagePath })
              .from(photos)
              .where(and(eq(photos.userId, p.id), eq(photos.isPrimary, true)))
              .limit(1);
            
            const pPhotoUrl = pPhoto
              ? `${MINIO_URL}/${pPhoto.storagePath.replace(/-original\.[a-zA-Z0-9]+$/, "-thumb.jpg")}`
              : null;
              
            return {
              ...p,
              primary_photo_url: pPhotoUrl,
            };
          })
        );

        return reply.send(enrichedProfiles);
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
            country: profiles.country,
            bodyType: profiles.bodyType,
            skinTone: profiles.skinTone,
            children: profiles.children,
            netWorth: profiles.netWorth,
            seekingGender: profiles.seekingGender,
            travelPreference: profiles.travelPreference,
            availability: profiles.availability,
            partnershipType: profiles.partnershipType,
            meetingFrequency: profiles.meetingFrequency,
          })
          .from(profiles)
          .innerJoin(users, eq(profiles.id, users.id))
          .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)));

        if (!profile) {
          return reply.status(404).send({ message: "Perfil não encontrado." });
        }

        // Bloquear visualização de perfis não aprovados por usuários comuns
        const viewerId = (request.user as { sub: string }).sub;
        if (profile.id !== viewerId) {
          const [viewerUser] = await db
            .select({ profileType: users.profileType })
            .from(users)
            .where(eq(users.id, viewerId));
            
          const isStaff = viewerUser?.profileType === "admin" || viewerUser?.profileType === "moderator";
          
          const [profileStatus] = await db
            .select({ moderationStatus: profiles.moderationStatus })
            .from(profiles)
            .where(eq(profiles.id, id));
            
          if (profileStatus?.moderationStatus !== "approved" && !isStaff) {
            return reply.status(404).send({ message: "Perfil não encontrado ou pendente de moderação." });
          }
        }

        // =====================================================
        // FEATURE PREMIUM: Notificar visualização de perfil
        // =====================================================
        if (profile.isPremium && viewerId !== profile.id) {
          // Busca o nome do visitante para a notificação
          const [viewer] = await db
            .select({ displayName: profiles.displayName })
            .from(profiles)
            .where(eq(profiles.id, viewerId));

          if (viewer) {
            const { notifications } = await import("../db/schema.js");
            
            // Opcional: Impedir spam verificando se já não notificou recentemente
            await db.insert(notifications).values({
              userId: profile.id,
              type: "profile_view",
              title: "👀 Alguém está de olho em você!",
              body: `${viewer.displayName} acabou de visitar seu perfil. Dê o primeiro passo e envie uma mensagem!`,
              link: `/matches`, // O link poderia ir direto pro perfil se o frontend suportasse
            });
          }
        }

        // Busca a foto principal do perfil para exibição
        const [primaryPhoto] = await db
          .select({ storagePath: photos.storagePath })
          .from(photos)
          .where(and(eq(photos.userId, id), eq(photos.isPrimary, true)))
          .limit(1);

        // Busca todas as fotos do perfil (apenas aprovadas para visitantes, todas para o dono)
        const allPhotosList = await db
          .select({
            id: photos.id,
            storagePath: photos.storagePath,
            isPrimary: photos.isPrimary,
            status: photos.status,
          })
          .from(photos)
          .where(
            viewerId === profile.id
              ? eq(photos.userId, id)
              : and(eq(photos.userId, id), eq(photos.status, "approved"))
          );

        const MINIO_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000/sweetaffinity-media";
        const primaryPhotoUrl = primaryPhoto 
          ? `${MINIO_URL}/${primaryPhoto.storagePath.replace(/-original\.[a-zA-Z0-9]+$/, "-thumb.jpg")}`
          : null;

        const photosMapped = allPhotosList.map((p) => ({
          id: p.id,
          url: `${MINIO_URL}/${p.storagePath}`,
          isPrimary: p.isPrimary,
          status: p.status,
        }));

        return reply.send({
          ...profile,
          primaryPhotoUrl,
          photos: photosMapped,
        });
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