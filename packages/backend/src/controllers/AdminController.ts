import { FastifyInstance } from "fastify";
export const adminRoutes = async (fastify: FastifyInstance) => {
  // CorreCao rapida do erro de sintaxe
  eastify.get("/health", async () => ({ status: "ok" }));
};