import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Server, Socket } from "socket.io";
import { db } from "../db/index.js";
import { users, messages } from "../db/schema.js";
import { eq, or, and, asc } from "drizzle-orm";

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

        const user = request.user as { sub: string };
        const { receiverId } = request.params as {
          receiverId: string;
        };

        const history = await db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            content: messages.content,
            readAt: messages.readAt,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            or(
              and(eq(messages.senderId, user.sub), eq(messages.receiverId, receiverId)),
              and(eq(messages.senderId, receiverId), eq(messages.receiverId, user.sub))
            )
          )
          .orderBy(asc(messages.createdAt));

        return reply.send(history);
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
    const user = socket.data.user as { sub: string };

    // =====================================================
    // REGISTER USER ONLINE
    // =====================================================

    socket.on("register_user", (userId: string) => {
      if (!userId || userId !== user.sub) return;

      onlineUsers.set(userId, socket.id);

      io.emit("user_status_changed", {
        userId,
        status: "online",
      });
    });

    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const containsPhoneNumber = (currentMessage: string): boolean => {
      const numberMap: { [key: string]: string } = {
          'zero': '0', 'um': '1', 'hum': '1', 'uma': '1', 'dois': '2', 'tres': '3',
          'quatro': '4', 'cinco': '5', 'seis': '6', 'meia': '6', 'sete': '7',
          'oito': '8', 'nove': '9', 'nono': '9', 'dez': '10'
      };
      const normalizeText = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const numberWordsRegex = new RegExp(Object.keys(numberMap).join('|'), 'g');
      const convertToDigits = (str: string) => normalizeText(str).replace(numberWordsRegex, match => numberMap[match]);

      const currentMsgWithDigits = convertToDigits(currentMessage);
      const currentMsgDigitsOnly = currentMsgWithDigits.replace(/\D/g, '');
      const currentMsgNonNumericChars = convertToDigits(currentMessage).replace(/[\d\s]/g, '');

      // Simple heuristic for standalone phone numbers
      if (currentMsgDigitsOnly.length > 0 && currentMsgNonNumericChars.length < 4 && currentMessage.length < 30) {
          return true;
      }
      
      const fullDigitString = currentMsgWithDigits.replace(/\D/g, '');
      if (/\d{8,}/.test(fullDigitString)) {
          return true;
      }
      return false;
    };

    socket.on(
      "send_message",
      async (data: {
        sender_id: string;
        receiver_id: string;
        content: string;
      }) => {
        try {
          // 🔐 segurança: valida sender real
          if (data.sender_id !== user.sub) {
            return socket.emit("message_error", {
              error: "Unauthorized sender",
            });
          }

          // 🛡️ Segurança: Anti-DLP (Impede envio de contatos)
          if (containsPhoneNumber(data.content)) {
            return socket.emit("message_error", {
              error: "Por questões de segurança, o envio de contatos pessoais não é permitido.",
            });
          }

          const result = await db
            .insert(messages)
            .values({
              senderId: data.sender_id,
              receiverId: data.receiver_id,
              content: data.content,
            })
            .returning({
              id: messages.id,
              senderId: messages.senderId,
              receiverId: messages.receiverId,
              content: messages.content,
              createdAt: messages.createdAt,
            });

          const savedMessage = result[0];

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