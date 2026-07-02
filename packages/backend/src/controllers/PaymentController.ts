import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Stripe from "stripe";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

// Instância do Stripe. Usando chave dummy fallback caso não configurada.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_123", {
  apiVersion: "2025-01-27.acacia",
});

export async function paymentRoutes(app: FastifyInstance) {
  // Autenticação obrigatória para as rotas a seguir
  app.addHook("onRequest", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Não autorizado." });
    }
  });

  // =====================================================
  // POST /api/payment/create-intent
  // =====================================================
  app.post("/api/payment/create-intent", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;
      const { planId } = req.body as { planId: string };

      if (!planId) {
        return reply.status(400).send({ message: "Plano inválido." });
      }

      // Preços simulados em centavos (ex: 9900 = R$ 99,00)
      const amount = planId === "premium" ? 9900 : 14900; 

      // Cria a intenção de pagamento no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "brl",
        metadata: {
          userId,
          planId,
        },
      });

      return reply.send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao criar intenção de pagamento no Stripe." });
    }
  });

  // =====================================================
  // POST /api/payment/confirm (MOCK para desenvolvimento)
  // Normalmente isso seria feito via Webhook do Stripe (stripe.webhooks.constructEvent)
  // Mas como a UI atual simula o preenchimento, vamos permitir a confirmação direta
  // para facilitar a transição de Mock -> Real.
  // =====================================================
  app.post("/api/payment/confirm", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;
      const { paymentIntentId } = req.body as { paymentIntentId: string };

      // Como ainda não ativamos chaves reais para o client enviar o cartão para a Stripe,
      // pulamos a checagem real se a chave for a dummy.
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("dummy")) {
         // Simula aprovação imediata
         await db.update(users).set({ isPremium: true }).where(eq(users.id, userId));
         return reply.send({ success: true, message: "Pagamento confirmado (Simulação)" });
      }

      // Validação Real no Stripe
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status === "succeeded") {
        await db.update(users).set({ isPremium: true }).where(eq(users.id, userId));
        return reply.send({ success: true });
      } else {
        return reply.status(400).send({ message: "Pagamento ainda não aprovado no Stripe." });
      }

    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao confirmar pagamento." });
    }
  });
}
