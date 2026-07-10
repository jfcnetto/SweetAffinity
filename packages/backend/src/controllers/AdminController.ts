import { FastifyInstance } from "fastify";

export const adminRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/health", async () => ({ status: "ok" }));
};
