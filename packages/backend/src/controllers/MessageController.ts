import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server, Socket } from 'socket.io';
import { pgPool } from '../index.ts';

// Mapa em memória para rastrear quais usuários estão online e seus respectivos IDs de Socket
const onlineUsers = new Map<string, string>();

export const messageRoutes = async (fastify: FastifyInstance) => {

  // ─── ENDPOINT REST: CARREGAR HISTÓRICO DE MENSAGENS (CONVERSA CHAT) ───
  fastify.get('/history/:receiverId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ message: 'Sessão expirada ou inválida.' });
    }

    const user = request.user as { id: string };
    const { receiverId } = request.params as { receiverId: string };

    try {
      // Busca as mensagens trocadas entre o remetente e o destinatário em ordem cronológica
      const queryText = `
        SELECT id, sender_id, receiver_id, content, read_at, created_at
        FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC;
      `;
      
      const result = await pgPool.query(queryText, [user.id, receiverId]);
      return reply.send(result.rows);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro ao carregar o histórico do chat.' });
    }
  });
};

// ─── HANDLER DO SOCKET.IO: GERENCIAMENTO DE EVENTOS EM TEMPO REAL ──────
export const initChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Evento disparado assim que o Frontend conecta para registrar o Usuário Online
    socket.on('register_user', (userId: string) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        io.emit('user_status_changed', { userId, status: 'online' });
      }
    });

    // Evento principal: Escuta o envio de novas mensagens instantâneas
    socket.on('send_message', async (data: { sender_id: string; receiver_id: string; content: string }) => {
      const { sender_id, receiver_id, content } = data;

      try {
        // 1. Persiste a mensagem imediatamente no Banco de Dados Relacional Postgres
        const insertQuery = `
          INSERT INTO messages (sender_id, receiver_id, content)
          VALUES ($1, $2, $3)
          RETURNING id, sender_id, receiver_id, content, created_at;
        `;
        const result = await pgPool.query(insertQuery, [sender_id, receiver_id, content]);
        const savedMessage = result.rows[0];

        // 2. Verifica se o destinatário está online no momento
        const receiverSocketId = onlineUsers.get(receiver_id);

        if (receiverSocketId) {
          // Encaminha em tempo real via WebSocket direto para o socket do destinatário
          io.to(receiverSocketId).emit('receive_message', savedMessage);
        }

        // Devolve a confirmação de sucesso e entrega para o remetente
        socket.emit('message_sent_confirm', savedMessage);

      } catch (error) {
        console.error('Erro ao processar mensagem no socket:', error);
        socket.emit('message_error', { error: 'Não foi possível entregar sua mensagem.' });
      }
    });

    // Gerencia a desconexão do usuário limpando o mapa de monitoramento
    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('user_status_changed', { userId, status: 'offline' });
          break;
        }
      }
    });
  });
};