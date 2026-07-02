import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { profiles, users, swipes, matches, messages, notifications } from "../db/schema.js";
import { eq, or } from "drizzle-orm";

export const lgpdRoutes = async (fastify: FastifyInstance) => {
  // Autenticação obrigatória
  fastify.addHook("onRequest", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Não autorizado." });
    }
  });

  // =====================================================
  // GET /api/lgpd/export — Exportação completa de dados
  // =====================================================
  fastify.get("/export", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as { sub: string };
      const userId = user.sub;

      // 1. Dados da Tabela Profile
      const [userProfile] = await db.select().from(profiles).where(eq(profiles.id, userId));
      
      // 2. Dados da Tabela Users (Auth)
      const [userAccount] = await db.select().from(users).where(eq(users.id, userId));

      // 3. Swipes feitos e recebidos
      const userSwipes = await db
        .select()
        .from(swipes)
        .where(or(eq(swipes.fromUserId, userId), eq(swipes.toUserId, userId)));

      // 4. Matches
      const userMatches = await db
        .select()
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

      // 5. Mensagens enviadas e recebidas
      const userMessages = await db
        .select()
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));

      // 6. Notificações
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId));

      const exportedData = {
        meta: {
          exportDate: new Date().toISOString(),
          requestedBy: userId,
        },
        account: userAccount || null,
        profile: userProfile || null,
        swipes: userSwipes,
        matches: userMatches,
        messages: userMessages,
        notifications: userNotifications,
      };

      // Define header para download de JSON
      reply.header("Content-Disposition", `attachment; filename=lgpd_export_${userId}.json`);
      reply.type("application/json");

      return reply.send(exportedData);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao gerar exportação de dados (LGPD)." });
    }
  });

  // =====================================================
  // DELETE /api/lgpd/delete — Exclusão permanente (Hard Delete)
  // =====================================================
  fastify.delete("/delete", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as { sub: string };
      const userId = user.sub;

      // Por segurança e compliance, apagamos registros filhos primeiro ou em cascata
      
      // 1. Apagar notificações
      await db.delete(notifications).where(eq(notifications.userId, userId));
      
      // 2. Apagar mensagens
      await db.delete(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
      
      // 3. Apagar Matches
      await db.delete(matches).where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

      // 4. Apagar Swipes
      await db.delete(swipes).where(or(eq(swipes.fromUserId, userId), eq(swipes.toUserId, userId)));

      // 5. Apagar Profile
      await db.delete(profiles).where(eq(profiles.id, userId));

      // 6. Apagar User (Auth)
      await db.delete(users).where(eq(users.id, userId));

      return reply.status(200).send({ message: "Sua conta e todos os seus dados foram permanentemente apagados dos nossos servidores." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao excluir conta (LGPD)." });
    }
  });
};
