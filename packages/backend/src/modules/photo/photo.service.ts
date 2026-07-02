import { db } from "../../db/index.js";
import { photos } from "../../db/schema.js";
import { eq, count } from "drizzle-orm";
import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export const PhotoService = {
  /**
   * Upload de fotos (Perfil, Validação ou Background)
   * Regras: RN-012 (Quota), RN-015 (Mimetypes), RN-016 (Thumbnails)
   */
  async uploadPhoto(userId: string, fileBuffer: Buffer, mimetype: string, type: "profile" | "validation" | "background") {
    // Validação de Quota (RN-012)
    const currentCount = await db
      .select({ count: count() })
      .from(photos)
      .where(eq(photos.userId, userId));

    if (currentCount[0].count >= 10) {
      throw new Error("Limite de 10 fotos excedido.");
    }

    const photoId = randomUUID();
    const extension = mimetype.split("/")[1];
    const originalKey = `users/${userId}/photos/${photoId}-original.${extension}`;
    const thumbKey = `users/${userId}/photos/${photoId}-thumb.jpg`;

    // Processamento de imagem (RN-016)
    const thumbBuffer = await sharp(fileBuffer)
      .resize(400, 400, { fit: "cover" })
      .toBuffer();

    // Upload MinIO
    await s3Client.send(new PutObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: originalKey, Body: fileBuffer }));
    await s3Client.send(new PutObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: thumbKey, Body: thumbBuffer }));

    // Persistência DB
    return await db.insert(photos).values({
      id: photoId,
      userId,
      url: originalKey,
      thumbnailUrl: thumbKey,
      type: type, 
      status: "pending",
    }).returning();
  },

  async deletePhoto(photoId: string, userId: string) {
    // Implementação de exclusão (RN-017)
    // 1. Buscar registro, 2. Deletar do MinIO, 3. Deletar do DB
  }
};