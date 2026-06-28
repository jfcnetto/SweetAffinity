import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { pgPool } from '../index.js';

// Inicializa o cliente S3 apontando para o nosso container local do MinIO
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1', // MinIO local aceita qualquer região fictícia
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'sweet_admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'sweet_secret_password_2026'
  },
  forcePathStyle: true // Obrigatório para o MinIO funcionar corretamente localmente
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'sweet-photos';

export const photoRoutes = async (fastify: FastifyInstance) => {
  // Registra o plugin de multipart apenas neste escopo de rotas
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // Limite de 10MB por foto para preservar armazenamento
    }
  });

  // ─── ENDPOINT DE UPLOAD PROTEGIDO POR JWT ──────────────────────────────
  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Validação do Token JWT (Garante que o usuário está logado)
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ message: 'Sessão expirada ou inválida.' });
    }

    const user = request.user as { id: string };

    // 2. Captura o arquivo do fluxo Multipart HTTP
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ message: 'Nenhum arquivo de imagem foi enviado.' });
    }

    // Validação básica de extensão para segurança
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      return reply.status(400).send({ message: 'Formato inválido. Envie apenas JPEG, PNG ou WebP.' });
    }

    try {
      const fileBuffer = await data.toBuffer();
      const fileExtension = data.filename.split('.').pop() || 'jpg';
      
      // Gera um caminho único baseado no ID do usuário e um UUID próprio da foto
      const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
      const storagePath = `${user.id}/${uniqueFileName}`;

      // 3. Envia o binário para o container do MinIO
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storagePath,
        Body: fileBuffer,
        ContentType: data.mimetype
      }));

      // 4. Verifica se o usuário já possui alguma foto cadastrada
      // Se não possuir, essa nova foto será automaticamente marcada como primária (perfil)
      const existingPhotos = await pgPool.query(
        'SELECT id FROM photos WHERE user_id = $1',
        [user.id]
      );
      const isPrimary = existingPhotos.rowCount === 0;

      // 5. Salva a referência no Banco de Dados Relacional local
      const insertQuery = `
        INSERT INTO photos (user_id, storage_path, is_primary, is_approved)
        VALUES ($1, $2, $3, $4)
        RETURNING id, storage_path, is_primary, is_approved;
      `;
      
      // Como o Backoffice Administrativo gerencia a moderação, o padrão da foto é aprovada no ambiente local/teste
      const isApproved = true; 

      const result = await pgPool.query(insertQuery, [
        user.id,
        storagePath,
        isPrimary,
        isApproved
      ]);

      return reply.status(201).send({
        message: 'Upload concluído com sucesso!',
        photo: result.rows[0]
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao processar o upload da imagem.' });
    }
  });
};