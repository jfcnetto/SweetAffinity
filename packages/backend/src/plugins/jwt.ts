import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";

export default fp(async (app) => {
  app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev_secret_change_me",
  });

  // =====================================================
  // DECORATOR: fastify.authenticate
  // Uso: preHandler: [fastify.authenticate] ou onRequest: [fastify.authenticate]
  // Verifica o JWT e injeta request.user
  // =====================================================
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({
          statusCode: 401,
          error: "Unauthorized",
          message: "Sessão inválida ou expirada.",
        });
      }
    }
  );
});