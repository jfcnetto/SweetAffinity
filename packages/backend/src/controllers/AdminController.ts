import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pgPool } from '../index.ts';

export const adminRoutes = async (fastify: FastifyInstance) => {

  // Middleware de Ciclo de Vida: Garante que apenas Administradores acessem estas rotas
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: string; role?: string };
      
      // Validação estrita do papel de Administrador
      if (user.role !== 'admin' && user.role !== 'moderator') {
        return reply.status(403).send({ message: 'Acesso negado. Recurso exclusivo para administradores.' });
      }
    } catch (err) {
      return reply.status(401).send({ message: 'Sessão inválida ou expirada.' });
    }
  });

  // ─── 1. LISTAR USUÁRIOS DO SISTEMA COM FILTROS ────────────────────────
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, profile_type, limit = 20, offset = 0 } = request.query as {
      status?: string;
      profile_type?: string;
      limit?: number;
      offset?: number;
    };

    try {
      let queryText = `
        SELECT u.id, u.email, u.profile_type, u.status, u.role, u.created_at, p.display_name, p.city, p.state
        FROM users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE 1=1
      `;
      const queryParams: any[] = [];

      if (status) {
        queryParams.push(status);
        queryText += ` AND u.status = $${queryParams.length}`;
      }

      if (profile_type) {
        queryParams.push(profile_type);
        queryText += ` AND u.profile_type = $${queryParams.length}`;
      }

      queryParams.push(Number(limit), Number(offset));
      queryText += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

      const result = await pgPool.query(queryText, queryParams);
      return reply.send(result.rows);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro ao listar usuários para administração.' });
    }
  });

  // ─── 2. ALTERAR STATUS DO USUÁRIO (BANIR, SUSPENDER, ATIVAR) ──────────
  fastify.put('/users/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'active' | 'suspended' | 'banned' };

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return reply.status(400).send({ message: 'Status inválido informado.' });
    }

    try {
      const queryText = `
        UPDATE users 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING id, email, status;
      `;
      const result = await pgPool.query(queryText, [status, id]);

      if (result.rowCount === 0) {
        return reply.status(404).send({ message: 'Usuário não encontrado.' });
      }

      return reply.send({
        message: `Status do usuário atualizado para ${status} com sucesso.`,
        user: result.rows[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro ao atualizar status do usuário.' });
    }
  });

  // ─── 3. LISTAR FOTOS PENDENTES DE MODERAÇÃO ───────────────────────────
  fastify.get('/photos/pending', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const queryText = `
        SELECT ph.id, ph.user_id, ph.storage_path, ph.is_primary, ph.created_at, p.display_name
        FROM photos ph
        INNER JOIN profiles p ON ph.user_id = p.id
        WHERE ph.is_approved = false
        ORDER BY ph.created_at ASC;
      `;
      const result = await pgPool.query(queryText);
      
      const MINIO_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000/sweet-photos';
      const photos = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        display_name: row.display_name,
        is_primary: row.is_primary,
        created_at: row.created_at,
        url: `${MINIO_URL}/${row.storage_path}`
      }));

      return reply.send(photos);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro ao listar fotos pendentes.' });
    }
  });

  // ─── 4. APROVAR OU REJEITAR UMA FOTO DE PERFIL ────────────────────────
  fastify.put('/photos/:id/approval', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { approved } = request.body as { approved: boolean };

    try {
      if (approved) {
        // Aprova a foto na tabela relacional
        const updateQuery = `
          UPDATE photos 
          SET is_approved = true, updated_at = NOW() 
          WHERE id = $1 
          RETURNING id, user_id, storage_path, is_primary;
        `;
        const result = await pgPool.query(updateQuery, [id]);

        if (result.rowCount === 0) {
          return reply.status(404).send({ message: 'Foto não encontrada.' });
        }

        return reply.send({ message: 'Foto aprovada com sucesso.', photo: result.rows[0] });
      } else {
        // Se for rejeitada, removemos o registro (em produção você também removeria do MinIO)
        const deleteQuery = `DELETE FROM photos WHERE id = $1 RETURNING id, storage_path;`;
        const result = await pgPool.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
          return reply.status(404).send({ message: 'Foto não encontrada.' });
        }

        return reply.send({ message: 'Foto rejeitada e removida do sistema por violar os termos.' });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro ao processar moderação da foto.' });
    }
  });
};