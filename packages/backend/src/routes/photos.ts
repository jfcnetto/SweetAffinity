import { FastifyInstance } from "fastify";
import { PhotoController } from "../controllers/photo.controller.js";

export async function photoRoutes(fastify: FastifyInstance) {
  
  // Rate Limiting para endpoints de upload (conforme Fase 3)
  const rateLimitOptions = {
    max: 10, // Exemplo de limite para esta rota específica
    timeWindow: '1 minute',
  };

  // POST /photos/upload - Protegido por JWT
  fastify.post(
    "/upload", 
    { 
      preHandler: [fastify.authenticate], // Middleware de autenticação JWT
      config: { rateLimit: rateLimitOptions } 
    },
    PhotoController.upload
  );

  // DELETE /photos/:id - Protegido por JWT
  fastify.delete(
    "/:id", 
    { 
      preHandler: [fastify.authenticate] 
    },
    PhotoController.delete
  );
}