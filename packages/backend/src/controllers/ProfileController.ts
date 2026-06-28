import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pgPool } from '../index.ts';

export const profileRoutes = async (fastify: FastifyInstance) => {

  // ─── ENDPOINT PRIVADO: RETORNA O FEED DE PERFIS FILTRADO ────────────────
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // Validação opcional de token caso queira fechar o feed apenas para logados
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ message: 'Sessão expirada ou inválida.' });
    }

    const user = request.user as { id: string; profile_type: string };

    try {
      // Regra de Negócio: Sugar Daddies/Mommies veem Sugar Babies e vice-versa
      const targetType = (user.profile_type === 'Daddy' || user.profile_type === 'Mommy') 
        ? 'Baby' 
        : ['Daddy', 'Mommy'];

      let queryText = `
        SELECT 
          p.*,
          (SELECT storage_path FROM photos WHERE user_id = p.id AND is_primary = true AND is_approved = true LIMIT 1) as primary_photo_path
        FROM profiles p
        INNER JOIN users u ON u.id = p.id
        WHERE u.status = 'active' AND p.is_active = true
      `;

      const queryParams: any[] = [];
      
      if (Array.isArray(targetType)) {
        queryText += ` AND u.profile_type IN ($1, $2)`;
        queryParams.push(targetType[0], targetType[1]);
      } else {
        queryText += ` AND u.profile_type = $1`;
        queryParams.push(targetType);
      }

      const result = await pgPool.query(queryText, queryParams);

      // Mapeia os caminhos de armazenamento do MinIO para URLs completas acessíveis pelo front
      const MINIO_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000/sweet-photos';
      
      const formattedProfiles = result.rows.map(row => ({
        id: row.id,
        display_name: row.display_name,
        birth_date: row.birth_date,
        state: row.state,
        city: row.city,
        gender: row.gender,
        marital_status: row.marital_status,
        height_range: row.height_range,
        ethnicity: row.ethnicity,
        hair_color: row.hair_color,
        eye_color: row.eye_color,
        smoking: row.smoking,
        drinking: row.drinking,
        education: row.education,
        profession: row.profession,
        income_range: row.income_range,
        popularity_score: Number(row.popularity_score) || 0,
        profile_views: Number(row.profile_views) || 0,
        is_active: row.is_active,
        updated_at: row.updated_at,
        primary_photo_url: row.primary_photo_path ? `${MINIO_URL}/${row.primary_photo_path}` : null
      }));

      return reply.send(formattedProfiles);

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar os perfis do feed.' });
    }
  });
};