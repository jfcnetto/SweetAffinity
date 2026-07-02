import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

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
  process.env.MINIO_BUCKET_NAME || "sweet-photos";

const MINIO_URL =
  process.env.MINIO_PUBLIC_URL ||
  "http://localhost:9000/sweet-photos";

// =====================================================
// PHOTO ROUTES
// =====================================================

export const photoRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(multipart);

  // =====================================================
  // UPLOAD PHOTO
  // =====================================================

  fastify.post(
    "/upload",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        const user = request.user as { id: string };

        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: "Arquivo obrigatório.",
          });
        }

        // =====================================================
        // VALIDATION
        // =====================================================

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

        const fileName = `${randomUUID()}.${fileExtension}`;

        const storagePath = `users/${user.id}/${fileName}`;

        // =====================================================
        // UPLOAD TO MINIO / S3
        // =====================================================

        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: storagePath,
            Body: fileBuffer,
            ContentType: file.mimetype,
          })
        );

        // =====================================================
        // SAVE TO DATABASE
        // =====================================================

        const [photo] = await db
          .insert(photos)
          .values({
            userId: user.id,
            storagePath,
            isPrimary: false,
            isApproved: false,
          })
          .returning();

        return reply.status(201).send({
          message: "Foto enviada com sucesso.",
          photo: {
            ...photo,
            url: `${MINIO_URL}/${storagePath}`,
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

        const user = request.user as { id: string };

        const userPhotos = await db
          .select()
          .from(photos)
          .where(eq(photos.userId, user.id));

        return reply.send(
          userPhotos.map((p) => ({
            ...p,
            url: `${MINIO_URL}/${p.storagePath}`,
          }))
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
        const viewer = request.user as { id: string; isPremium?: boolean };

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
          visiblePhotos.map((p) => ({
            ...p,
            url: `${MINIO_URL}/${p.storagePath}`,
          }))
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao buscar fotos do usuário." });
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

        const user = request.user as { id: string };

        const { id } = request.params as { id: string };

        // Busca a foto para obter o path
        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, id), eq(photos.userId, user.id)));

        if (!photo) {
          return reply.status(404).send({
            message: "Foto não encontrada.",
          });
        }

        // Remove do MinIO
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: photo.storagePath,
          })
        );

        // Remove do Banco
        const deleted = await db
          .delete(photos)
          .where(eq(photos.id, id))
          .returning();