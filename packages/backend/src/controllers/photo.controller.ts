import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import sharp from "sharp"; // Adicionado para RN-016

import { db } from "../db/index.js";
import { photos } from "../db/schema.js";
import { eq, count, and } from "drizzle-orm";

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

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "sweet-photos";
const MINIO_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000/sweet-photos";

// =====================================================
// PHOTO ROUTES
// =====================================================

export const photoRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // RN-015: 10MB

  fastify.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: string };

      // RN-012: Quota de 10 fotos
      const [userPhotosCount] = await db.select({ count: count() }).from(photos).where(eq(photos.userId, user.id));
      if (userPhotosCount.count >= 10) return reply.status(422).send({ message: "Limite de 10 fotos atingido." });

      const file = await request.file();
      if (!file) return reply.status(400).send({ message: "Arquivo obrigatório." });

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
        return reply.status(400).send({ message: "Formato de arquivo inválido." });
      }

      const fileBuffer = await file.toBuffer();
      const uuid = randomUUID();
      const storagePath = `users/${user.id}/photos/${uuid}-original.${file.filename.split(".").pop()}`;
      const thumbPath = `users/${user.id}/photos/${uuid}-thumb.jpg`;

      // Upload Original
      await s3Client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: storagePath, Body: fileBuffer, ContentType: file.mimetype }));

      // RN-016: Gerar Thumbnail 400x400
      const thumbBuffer = await sharp(fileBuffer).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
      await s3Client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: thumbPath, Body: thumbBuffer, ContentType: "image/jpeg" }));

      const [photo] = await db.insert(photos).values({ userId: user.id, storagePath, thumbPath, isPrimary: false, isApproved: false }).returning();

      return reply.status(201).send({ message: "Foto enviada.", photo });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro no upload." });
    }
  });

  fastify.get("/my-photos", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: string };
      const userPhotos = await db.select().from(photos).where(eq(photos.userId, user.id));
      return reply.send(userPhotos.map((p) => ({ ...p, url: `${MINIO_URL}/${p.storagePath}` })));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar fotos." });
    }
  });

  fastify.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const { id } = request.params as { id: string };
      
      // RN-017: Remover do MinIO
      const [photo] = await db.select().from(photos).where(eq(photos.id, id));
      if (!photo) return reply.status(404).send({ message: "Foto não encontrada." });

      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: photo.storagePath }));
      if (photo.thumbPath) await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: photo.thumbPath }));

      await db.delete(photos).where(eq(photos.id, id));
      return reply.send({ message: "Foto removida com sucesso." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Erro ao deletar foto." });
    }
  });
};