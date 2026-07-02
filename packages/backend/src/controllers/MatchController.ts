import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { users, profiles, swipes, matches, swipeActionEnum } from "../db/schema.js";
import { eq, and, ne, notInArray, or, inArray } from "drizzle-orm";

export async function matchRoutes(app: FastifyInstance) {
  // Autenticação obrigatória
  app.addHook("onRequest", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Não autorizado." });
    }
  });

  // =====================================================
  // GET /api/feed - Buscar perfis recomendados
  // =====================================================
  app.get("/api/feed", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;
      
      const { minAge, maxAge, radius, interests } = req.query as {
        minAge?: string;
        maxAge?: string;
        radius?: string; // in km
        interests?: string; // comma separated
      };

      // 1. Pega os dados do usuário atual (pra saber o que ele busca)
      const currentUser = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      });

      if (!currentUser) {
        return reply.status(404).send({ message: "Perfil não encontrado." });
      }

      // Sugar Dating Rules: Daddy/Mommy busca Baby. Baby busca Daddy/Mommy.
      // E converte isso pra ENUM correto conforme o DB schema ('baby', 'daddy', 'mommy')
      let targetRelationships: ("baby"|"daddy"|"mommy")[] = [];
      if (currentUser.relationshipType === "baby") {
        targetRelationships = ["daddy", "mommy"];
      } else {
        targetRelationships = ["baby"];
      }

      // 2. Pega todos os perfis que o usuário já avaliou (Like/Pass) para não repetir
      const pastSwipes = await db
        .select({ toUserId: swipes.toUserId })
        .from(swipes)
        .where(eq(swipes.fromUserId, userId));

      const swipedIds = pastSwipes.map((s) => s.toUserId);
      swipedIds.push(userId); // Adiciona o próprio usuário pra não curtir a si mesmo

      // Build filters dynamically
      import { sql } from 'drizzle-orm';
      
      const conditions = [
        eq(users.status, "active"),
        notInArray(profiles.id, swipedIds),
        inArray(profiles.relationshipType, targetRelationships)
      ];

      // Age filter
      if (minAge) {
        conditions.push(sql`extract(year from age(current_date, ${profiles.birthDate})) >= ${Number(minAge)}`);
      }
      if (maxAge) {
        conditions.push(sql`extract(year from age(current_date, ${profiles.birthDate})) <= ${Number(maxAge)}`);
      }

      // Location filter (Haversine)
      if (radius && currentUser.latitude && currentUser.longitude) {
        const rad = Number(radius);
        const lat = currentUser.latitude;
        const lng = currentUser.longitude;
        
        // 6371 is Earth's radius in km
        conditions.push(sql`
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(${profiles.latitude})) *
            cos(radians(${profiles.longitude}) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(${profiles.latitude}))
          )) <= ${rad}
        `);
      }

      // Interests filter (JSONB intersects)
      if (interests) {
        const interestArray = interests.split(',').map(i => i.trim());
        if (interestArray.length > 0) {
           // We use the JSONB ?| operator to check if any of the array elements exist in the interests jsonb array
           conditions.push(sql`${profiles.interests} ?| array[${sql.join(interestArray.map(i => sql`${i}`), sql`, `)}]`);
        }
      }

      // 3. Busca os recomendados!
      const feedProfiles = await db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
          birthDate: profiles.birthDate,
          city: profiles.city,
          state: profiles.state,
          bio: profiles.bio,
          relationshipType: profiles.relationshipType,
          popularityScore: profiles.popularityScore,
          interests: profiles.interests,
        })
        .from(profiles)
        .leftJoin(users, eq(users.id, profiles.id))
        .where(and(...conditions))
        .limit(20);
        
      // Ordena por popularidade (descendente)
      feedProfiles.sort((a, b) => b.popularityScore - a.popularityScore);

      return reply.send(feedProfiles);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao gerar feed." });
    }
  });

  // =====================================================
  // POST /api/swipe - Registrar Like ou Pass
  // =====================================================
  app.post("/api/swipe", async (req: any, reply: FastifyReply) => {
    try {
      const fromUserId = req.user.sub;
      const { toUserId, action } = req.body as { toUserId: string; action: "like" | "pass" };

      if (!toUserId || !["like", "pass"].includes(action)) {
        return reply.status(400).send({ message: "Dados inválidos." });
      }

      // Salvar o swipe
      await db.insert(swipes).values({
        fromUserId,
        toUserId,
        action,
      }).onConflictDoNothing({ target: [swipes.fromUserId, swipes.toUserId] });

      let isMatch = false;

      // Se for like, verificar se deu match
      if (action === "like") {
        const reverseSwipe = await db.query.swipes.findFirst({
          where: and(
            eq(swipes.fromUserId, toUserId),
            eq(swipes.toUserId, fromUserId),
            eq(swipes.action, "like")
          ),
        });

        if (reverseSwipe) {
          isMatch = true;

          // Criar registro na tabela matches (ordem alfabética do UUID para usar no unique match index)
          const user1Id = fromUserId < toUserId ? fromUserId : toUserId;
          const user2Id = fromUserId < toUserId ? toUserId : fromUserId;

          await db.insert(matches).values({
            user1Id,
            user2Id,
          }).onConflictDoNothing({ target: [matches.user1Id, matches.user2Id] });
        }
      }

      return reply.send({ success: true, match: isMatch });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao registrar swipe." });
    }
  });

  // =====================================================
  // GET /api/matches - Retorna os matches do usuário
  // =====================================================
  app.get("/api/matches", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;

      const userMatches = await db
        .select()
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

      const matchProfiles = [];

      for (const match of userMatches) {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.id, otherUserId),
          columns: {
            id: true,
            displayName: true,
            relationshipType: true,
          }
        });
        
        if(profile) {
          matchProfiles.push({
            matchId: match.id,
            createdAt: match.createdAt,
            profile,
          });
        }
      }

      return reply.send(matchProfiles);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao buscar matches." });
    }
  });
}
