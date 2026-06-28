import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { pgPool } from '../index.js';

export const authRoutes = async (fastify: FastifyInstance) => {

  // ─── ENDPOINT DE REGISTRO (SIGN UP) ──────────────────────────────────
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const client = await pgPool.connect();

    try {
      // 1. Verifica se o e-mail já está cadastrado
      const userExists = await client.query('SELECT id FROM users WHERE email = $1', [body.email]);
      if (userExists.rowCount && userExists.rowCount > 0) {
        return reply.status(400).send({ message: 'Este e-mail já está cadastrado no sistema.' });
      }

      // 2. Encripta a senha com segurança
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(body.password, saltRounds);

      // Inicia uma transação para garantir consistência relacional total
      await client.query('BEGIN');

      // 3. Insere o Usuário Base
      const userQuery = `
        INSERT INTO users (email, password_hash, profile_type, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING id, email, profile_type, is_verified, is_premium;
      `;
      const userResult = await client.query(userQuery, [
        body.email,
        passwordHash,
        body.profile_type
      ]);

      const newUser = userResult.rows[0];

      // 4. Insere o Perfil Avançado de Estilo de Vida e Aparência
      const profileQuery = `
        INSERT INTO profiles (
          id, display_name, birth_date, state, city, gender, marital_status,
          height_range, ethnicity, hair_color, eye_color, smoking, drinking,
          education, profession, income_range
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
      `;
      
      await client.query(profileQuery, [
        newUser.id,
        body.display_name,
        body.birth_date,
        body.state,
        body.city,
        body.gender, // "Busco por" mapeado para fins de busca relacional
        body.marital_status,
        body.height_range,
        body.ethnicity,
        body.hair_color,
        body.eye_color,
        body.smoking,
        body.drinking,
        body.education,
        body.profession,
        body.income_range
      ]);

      await client.query('COMMIT');

      // 5. Gera o Token de Sessão JWT nativo assinado pelo Fastify
      const token = fastify.jwt.sign({ 
        id: newUser.id, 
        email: newUser.email, 
        profile_type: newUser.profile_type 
      });

      return reply.status(201).send({
        message: 'Cadastro realizado com sucesso!',
        token,
        user: newUser
      });

    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao processar o cadastro do usuário.' });
    } finally {
      client.release();
    }
  });

  // ─── ENDPOINT DE LOGIN (SIGN IN) ────────────────────────────────────
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as any;

    try {
      // 1. Busca o usuário pelo e-mail
      const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rowCount === 0) {
        return reply.status(401).send({ message: 'E-mail ou senha incorretos.' });
      }

      const user = result.rows[0];

      // 2. Valida o status da conta
      if (user.status === 'suspended' || user.status === 'banned') {
        return reply.status(403).send({ message: `Esta conta está temporariamente ${user.status}.` });
      }

      // 3. Compara os hashes de senha com Bcrypt
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return reply.status(401).send({ message: 'E-mail ou senha incorretos.' });
      }

      // 4. Atualiza a estampa de data/hora do último login
      await pgPool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      // 5. Assina o Token JWT de Sessão
      const token = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email, 
        profile_type: user.profile_type 
      });

      return reply.send({
        message: 'Autenticação bem-succeeded!',
        token,
        user: {
          id: user.id,
          email: user.email,
          profile_type: user.profile_type,
          is_verified: user.is_verified,
          is_premium: user.is_premium
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao processar a autenticação.' });
    }
  });
};