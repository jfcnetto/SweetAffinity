import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { blogPosts } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export const blogRoutes = async (fastify: FastifyInstance) => {
  // GET /blog/clear-all — Limpar todos os posts da base de dados (Público/Dev)
  fastify.get(
    "/clear-all",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await db.delete(blogPosts);
        return reply.send({
          success: true,
          message: "Todos os artigos foram excluídos com sucesso do banco de dados!",
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          message: "Erro ao limpar banco de dados do blog.",
        });
      }
    }
  );

  // GET /blog — Listar posts do blog (público)
  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const posts = await db
          .select({
            id: blogPosts.id,
            title: blogPosts.title,
            slug: blogPosts.slug,
            content: blogPosts.content,
            metaDescription: blogPosts.metaDescription,
            source: blogPosts.source,
            publishedAt: blogPosts.publishedAt,
          })
          .from(blogPosts)
          .orderBy(desc(blogPosts.publishedAt));

        return reply.send(posts);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          message: "Erro ao carregar os posts do blog.",
        });
      }
    }
  );

  // GET /blog/:slug — Visualizar post por slug (público)
  fastify.get(
    "/:slug",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { slug } = request.params as { slug: string };

        const [post] = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, slug))
          .limit(1);

        if (!post) {
          return reply.status(404).send({
            message: "Artigo do blog não encontrado.",
          });
        }

        return reply.send(post);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          message: "Erro ao carregar o artigo do blog.",
        });
      }
    }
  );

  // POST /blog/generate — Acionar geração manual de artigo de IA (Protegido por Admin)
  fastify.post(
    "/generate",
    {
      preHandler: [fastify.authenticate], // Apenas usuários logados
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Importação dinâmica para evitar dependências circulares
        const { runDailyBlogCron, getLastLlmError, clearLastLlmError } = await import("../jobs/blogGenerator.js");
        clearLastLlmError();
        
        await runDailyBlogCron('ai_manual');
        
        const llmError = getLastLlmError();
        
        return reply.send({
          success: true,
          fallback: !!llmError,
          error: llmError,
          message: llmError
            ? `Artigo gerado usando ROTAÇÃO DE BACKUP LOCAL. Motivo do erro no Google/OpenAI/Claude: ${llmError}`
            : "Novo artigo gerado com sucesso via Inteligência Artificial!",
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          message: "Erro ao executar geração de artigo por IA.",
        });
      }
    }
  );

  // POST /admin/blog — Criar artigo manualmente
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as { title: string; slug: string; content: string; metaDescription: string };
        
        const newPost = await db.insert(blogPosts).values({
          title: body.title,
          slug: body.slug,
          content: body.content,
          metaDescription: body.metaDescription,
          source: 'manual',
          // authorId: request.user.id // opcional, mas podemos deixar set null no schema
        }).returning();

        return reply.send({ success: true, post: newPost[0] });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ message: "Erro ao criar artigo manual." });
      }
    }
  );

  // PUT /admin/blog/:id — Editar artigo
  fastify.put(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as { title: string; slug: string; content: string; metaDescription: string };

        const updated = await db.update(blogPosts).set({
          title: body.title,
          slug: body.slug,
          content: body.content,
          metaDescription: body.metaDescription,
          updatedAt: new Date()
        }).where(eq(blogPosts.id, id)).returning();

        return reply.send({ success: true, post: updated[0] });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ message: "Erro ao atualizar artigo." });
      }
    }
  );

  // DELETE /admin/blog/:id — Deletar artigo
  fastify.delete(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        await db.delete(blogPosts).where(eq(blogPosts.id, id));
        return reply.send({ success: true, message: "Artigo deletado com sucesso." });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ message: "Erro ao deletar artigo." });
      }
    }
  );
};
