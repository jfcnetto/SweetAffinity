import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
export async function notificationRoutes(server: FastifyInstance) {
  // Obter notificações do usuário
  server.get("/", async (request, reply) => {
    const user = request.user as { sub: string };
    
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.sub))
        .orderBy(desc(notifications.createdAt))
        .limit(20);

      return reply.send(userNotifications);
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // Marcar como lida
  server.put("/:id/read", async (request, reply) => {
    const user = request.user as { sub: string };
    const { id } = request.params as { id: string };

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));

      return reply.send({ success: true });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
