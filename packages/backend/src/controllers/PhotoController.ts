import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import sharp from "sharp";

import { db } from "../db/index.js";
import { photos } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// =====================================================
// CONFIG S3 / MINIO
// =====================================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET_NAME =
  process.env.MINIO_BUCKET_NAME || "sweetaffinity-media";

const MINIO_URL =
  process.env.MINIO_PUBLIC_URL ||
  "http://localhost:9000/sweetaffinity-media";

// =====================================================
// PHOTO ROUTES
// =====================================================

export const photoRoutes = async (fastify: FastifyInstance) => {
  // Garante a existência do bucket no MinIO local de forma auto-regenerativa no startup
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404 || err.name === "NoSuchBucket") {
      fastify.log.info(`Aviso: O bucket "${BUCKET_NAME}" não existe. Criando agora no MinIO local...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        fastify.log.info(`Sucesso: Bucket "${BUCKET_NAME}" criado.`);
      } catch (createErr) {
        fastify.log.error(`Erro crítico ao tentar criar o bucket "${BUCKET_NAME}":`, createErr);
      }
    } else {
      fastify.log.error(`Erro ao verificar a saúde do bucket "${BUCKET_NAME}":`, err);
    }
  }

  // Define a política pública de leitura (Read-Only) para o bucket no MinIO para que o navegador possa ler as fotos
  try {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicRead",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(policy),
      })
    );
    fastify.log.info(`✅ Política de leitura pública (Public Read) aplicada ao bucket "${BUCKET_NAME}".`);
  } catch (policyErr) {
    fastify.log.error(`Erro ao aplicar política pública ao bucket "${BUCKET_NAME}":`, policyErr);
  }

  // =====================================================
  // UPLOAD PHOTO
  // =====================================================

  fastify.post(
    "/upload",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as { sub: string };

        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: "Arquivo obrigatório.",
          });
        }

        // =====================================================
        // VALIDATION
        // =====================================================

        // RN-012: Verificar cota máxima de 10 fotos
        const userPhotos = await db.select().from(photos).where(eq(photos.userId, user.sub));
        if (userPhotos.length >= 10) {
          return reply.status(422).send({
            message: "Limite máximo de 10 fotos atingido.",
          });
        }

        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return reply.status(400).send({
            message: "Formato de arquivo inválido.",
          });
        }

        const fileBuffer = await file.toBuffer();

        const fileExtension = file.filename.split(".").pop();

        const fileName = `${randomUUID()}`;
        const originalPath = `users/${user.sub}/photos/${fileName}-original.${fileExtension}`;
        const thumbPath = `users/${user.sub}/photos/${fileName}-thumb.jpg`;

        // =====================================================
        // UPLOAD TO MINIO / S3
        // =====================================================

        // RN-016: Upload original
        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: originalPath,
            Body: fileBuffer,
            ContentType: file.mimetype,
          })
        );

        // RN-016: Gerar e subir thumbnail
        const thumbBuffer = await sharp(fileBuffer)
          .resize(400, 400, { fit: "cover" })
          .jpeg({ quality: 85 })
          .toBuffer();

        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: thumbPath,
            Body: thumbBuffer,
            ContentType: "image/jpeg",
          })
        );

        // =====================================================
        // SAVE TO DATABASE
        // =====================================================

        const [photo] = await db
          .insert(photos)
          .values({
            userId: user.sub,
            storagePath: originalPath, // O path do banco reflete o original. Em consultas, retornamos o thumb.
            isPrimary: false,
            status: "pending",  // RN-018: moderação inicial
          })
          .returning();

        return reply.status(201).send({
          message: "Foto enviada com sucesso.",
          photo: {
            ...photo,
            url: `${MINIO_URL}/${thumbPath}`, // Retorna o thumbnail por padrão
          },
        });
      } catch (error) {
        fastify.log.error(error);

        return reply.status(500).send({
          message: "Erro no upload da imagem.",
        });
      }
    }
  );

  // =====================================================
  // LIST USER PHOTOS
  // =====================================================

  fastify.get(
    "/my-photos",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as { sub: string };

        const userPhotos = await db
          .select()
          .from(photos)
          .where(eq(photos.userId, user.sub));

        return reply.send(
          userPhotos.map((p) => {
            const thumbPath = p.storagePath.replace(/-original\.[a-zA-Z0-9]+$/, "-thumb.jpg");
            return {
              ...p,
              url: `${MINIO_URL}/${thumbPath}`,
            };
          })
        );
      } catch (error) {
        fastify.log.error(error);

        return reply.status(500).send({
          message: "Erro ao buscar fotos.",
        });
      }
    }
  );

  // =====================================================
  // GET USER PHOTOS BY ID (RN-018: Filtro Premium)
  // =====================================================

  fastify.get(
    "/user/:userId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const { userId } = request.params as { userId: string };
        const viewer = request.user as { sub: string; isPremium?: boolean };

        const userPhotos = await db
          .select()
          .from(photos)
          .where(eq(photos.userId, userId));

        // Aplica filtro de visibilidade privada (RN-018)
        const visiblePhotos = userPhotos.filter((photo) => {
          if (photo.isPrivate && !viewer.isPremium) return false;
          return true;
        });

        return reply.send(
          visiblePhotos.map((p) => {
            const thumbPath = p.storagePath.replace(/-original\.[a-zA-Z0-9]+$/, "-thumb.jpg");
            return {
              ...p,
              url: `${MINIO_URL}/${thumbPath}`,
            };
          })
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao buscar fotos do usuário." });
      }
    }
  );

  // =====================================================
  // SET PHOTO AS PRIMARY (RN-013)
  // =====================================================

  fastify.put(
    "/:id/primary",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const { id } = request.params as { id: string };

        // Verifica se a foto existe e pertence ao user
        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, id), eq(photos.userId, user.sub)));

        if (!photo) {
          return reply.status(404).send({ message: "Foto não encontrada." });
        }

        // Remove a flag primary das outras
        await db
          .update(photos)
          .set({ isPrimary: false })
          .where(eq(photos.userId, user.sub));

        // Define a nova como primary
        await db
          .update(photos)
          .set({ isPrimary: true })
          .where(eq(photos.id, id));

        return reply.send({ message: "Foto definida como principal." });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao definir foto principal." });
      }
    }
  );

  // =====================================================
  // TOGGLE PHOTO PRIVACY (RN-018)
  // =====================================================

  fastify.put(
    "/:id/privacy",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const { id } = request.params as { id: string };
        const { isPrivate } = request.body as { isPrivate: boolean };

        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, id), eq(photos.userId, user.sub)));

        if (!photo) {
          return reply.status(404).send({ message: "Foto não encontrada." });
        }

        const [updatedPhoto] = await db
          .update(photos)
          .set({ isPrivate })
          .where(eq(photos.id, id))
          .returning();

        return reply.send({
          message: "Privacidade da foto atualizada.",
          photo: updatedPhoto,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao alterar privacidade." });
      }
    }
  );

  // =====================================================
  // DELETE PHOTO (RN-017: Transacional com MinIO)
  // =====================================================

  fastify.delete(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as { sub: string };

        const { id } = request.params as { id: string };

        // Busca a foto para obter o path
        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, id), eq(photos.userId, user.sub)));

        if (!photo) {
          return reply.status(404).send({
            message: "Foto não encontrada.",
          });
        }

        // Remove do MinIO (original e thumbnail RN-017)
        const thumbPath = photo.storagePath.replace(/-original\.[a-zA-Z0-9]+$/, "-thumb.jpg");
        
        await Promise.all([
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: photo.storagePath,
            })
          ),
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: thumbPath,
            })
          )
        ]);

        // Remove do Banco
        await db.delete(photos).where(eq(photos.id, id));

        return reply.status(200).send({
          message: "Foto removida com sucesso.",
        });
      } catch (error) {
        fastify.log.error(error);

        return reply.status(500).send({
          message: "Erro ao excluir foto.",
        });
      }
    }
  );
};