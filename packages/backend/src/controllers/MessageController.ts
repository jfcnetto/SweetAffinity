import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Server, Socket } from "socket.io";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

// =====================================================
// ONLINE USERS (MEMORY LAYER)
// =====================================================

const onlineUsers = new Map<string, string>();

// =====================================================
// REST ROUTES
// =====================================================

export const messageRoutes = async (fastify: FastifyInstance) => {
  // =====================================================
  // GET CHAT HISTORY
  // =====================================================

  fastify.get(
    "/history/:receiverId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as { id: string };
        const { receiverId } = request.params as {
          receiverId: string;
        };

        const messages = await db.execute(sql`
          SELECT id, sender_id, receiver_id, content, read_at, created_at
          FROM messages
          WHERE (sender_id = ${user.id} AND receiver_id = ${receiverId})
             OR (sender_id = ${receiverId} AND receiver_id = ${user.id})
          ORDER BY created_at ASC
        `);

        return reply.send(messages.rows);
      } catch (err) {
        fastify.log.error(err);

        return reply.status(401).send({
          message: "Sessão expirada ou inválida.",
        });
      }
    }
  );
};

// =====================================================
// SOCKET HANDLER
// =====================================================

export const initChatSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      // Aqui usamos Fastify JWT decode manualmente
      const decoded = socket.data.jwtDecode?.(token);

      // fallback simples (caso não injetado)
      socket.data.user = decoded;

      if (!decoded?.id) {
        return next(new Error("Unauthorized"));
      }

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as { id: string };

    // =====================================================
    // REGISTER USER ONLINE
    // =====================================================

    socket.on("register_user", (userId: string) => {
      if (!userId || userId !== user.id) return;

      onlineUsers.set(userId, socket.id);

      io.emit("user_status_changed", {
        userId,
        status: "online",
      });
    });

    // =====================================================
    // SEND MESSAGE
    // =====================================================

    socket.on(
      "send_message",
      async (data: {
        sender_id: string;
        receiver_id: string;
        content: string;
      }) => {
        try {
          // 🔐 segurança: valida sender real
          if (data.sender_id !== user.id) {
            return socket.emit("message_error", {
              error: "Unauthorized sender",
            });
          }

          const result = await db.execute(sql`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES (${data.sender_id}, ${data.receiver_id}, ${data.content})
            RETURNING id, sender_id, receiver_id, content, created_at;
          `);

          const savedMessage = result.rows[0];

          const receiverSocketId = onlineUsers.get(
            data.receiver_id
          );

          if (receiverSocketId) {
            io.to(receiverSocketId).emit(
              "receive_message",
              savedMessage
            );
          }

          socket.emit("message_sent_confirm", savedMessage);
        } catch (err) {
          console.error("Socket message error:", err);

          socket.emit("message_error", {
            error: "Não foi possível enviar a mensagem.",
          });
        }
      }
    );

    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          io.emit("user_status_changed", {
            userId,
            status: "offline",
          });

          break;
        }
      }
    });
  });
};