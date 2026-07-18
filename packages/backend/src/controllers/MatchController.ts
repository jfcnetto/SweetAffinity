import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { users, profiles, swipes, matches, swipeActionEnum } from "../db/schema.js";
import { eq, and, ne, notInArray, or, inArray, gte, lte } from "drizzle-orm";

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
  // GET /feed - Buscar perfis recomendados
  // =====================================================
  app.get("/feed", async (req: any, reply: FastifyReply) => {
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
      
      const conditions = [
        eq(users.status, "active"),
        notInArray(profiles.id, swipedIds),
        inArray(profiles.relationshipType, targetRelationships)
      ];

      // Age filter
      if (minAge) {
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - Number(minAge));
        conditions.push(lte(profiles.birthDate, minDate.toISOString()));
      }
      if (maxAge) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - (Number(maxAge) + 1));
        conditions.push(gte(profiles.birthDate, maxDate.toISOString()));
      }

      // Location filter (Bounding Box - Drizzle native)
      let lat = 0;
      let lng = 0;
      let rad = 0;
      if (radius && currentUser.latitude && currentUser.longitude) {
        rad = Number(radius);
        lat = currentUser.latitude;
        lng = currentUser.longitude;
        
        // 1 degree latitude = ~111 km
        const latDelta = rad / 111;
        const lngDelta = rad / (111 * Math.cos(lat * (Math.PI / 180)));
        
        conditions.push(gte(profiles.latitude, lat - latDelta));
        conditions.push(lte(profiles.latitude, lat + latDelta));
        conditions.push(gte(profiles.longitude, lng - lngDelta));
        conditions.push(lte(profiles.longitude, lng + lngDelta));
      }

      // 3. Busca inicial pelo DB
      let feedProfiles = await db
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
          latitude: profiles.latitude,
          longitude: profiles.longitude,
        })
        .from(profiles)
        .leftJoin(users, eq(users.id, profiles.id))
        .where(and(...conditions));

      // 4. Refinamento em Javascript (sem SQL puro)
      
      // Radius exato via Haversine
      if (rad > 0) {
        feedProfiles = feedProfiles.filter(p => {
          if (!p.latitude || !p.longitude) return false;
          const R = 6371; // Radius of the earth in km
          const dLat = (p.latitude - lat) * (Math.PI/180);
          const dLon = (p.longitude - lng) * (Math.PI/180); 
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * (Math.PI/180)) * Math.cos(p.latitude * (Math.PI/180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
          const distance = R * c; // Distance in km
          return distance <= rad;
        });
      }

      // Interesses (Intersection em JSONB via JS)
      if (interests) {
        const interestArray = interests.split(',').map(i => i.trim().toLowerCase());
        if (interestArray.length > 0) {
           feedProfiles = feedProfiles.filter(p => {
             const userInterests = Array.isArray(p.interests) ? p.interests.map(i => String(i).toLowerCase()) : [];
             return interestArray.some(i => userInterests.includes(i));
           });
        }
      }

      // Ordena por popularidade (descendente) e corta em 20
      feedProfiles.sort((a, b) => b.popularityScore - a.popularityScore);
      const finalFeed = feedProfiles.slice(0, 20).map(p => {
        // Remover lat/long da resposta final se não for necessário
        const { latitude, longitude, ...rest } = p;
        return rest;
      });

      return reply.send(finalFeed);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao gerar feed." });
    }
  });

  // =====================================================
  // POST /swipe - Realiza a ação de curtir/passar (RN-021)
  // =====================================================
  app.post("/swipe", async (req: any, reply: FastifyReply) => {
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

          // (Opcional) Notificar ambos sobre o match
          const { notifications } = await import("../db/schema.js");
          await db.insert(notifications).values([
            { userId: fromUserId, type: "match", title: "💖 Novo Match!", body: "Você deu um match! Vá para a aba de matches e mande uma mensagem.", link: "/matches" },
            { userId: toUserId, type: "match", title: "💖 Novo Match!", body: "Você deu um match! Vá para a aba de matches e mande uma mensagem.", link: "/matches" }
          ]);
        } else {
          // =====================================================
          // FEATURE GROWTH: Admirador Secreto (Semelhante ao Tinder)
          // Se deu like e não é match, notifica o recebedor para instigar a assinatura VIP
          // =====================================================
          const { notifications } = await import("../db/schema.js");
          await db.insert(notifications).values({
            userId: toUserId,
            type: "secret_admirer",
            title: "❤️ Alguém curtiu você!",
            body: "Você tem um novo admirador secreto. Torne-se VIP para descobrir quem é e dar match imediatamente!",
            link: "/plans",
          });
        }
      }

      return reply.send({ success: true, match: isMatch });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao registrar swipe." });
    }
  });

  // =====================================================
  // GET /matches - Retorna os matches do usuário
  // =====================================================
  app.get("/matches", async (req: any, reply: FastifyReply) => {
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
