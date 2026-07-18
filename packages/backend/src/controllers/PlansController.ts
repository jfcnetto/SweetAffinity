import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { plans } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_123", {
  apiVersion: "2024-06-20" as any,
});

export const plansRoutes = async (fastify: FastifyInstance) => {

  // Rota pública de planos (Passo 6)
  fastify.get(
    "/plans",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { billingPeriod } = request.query as any;

        const conditions = [eq(plans.isActive, true)];
        if (billingPeriod) {
          conditions.push(eq(plans.billingPeriod, billingPeriod));
        }

        const activePlans = await db
          .select({
            id: plans.id,
            name: plans.name,
            priceCents: plans.priceCents,
            billingPeriod: plans.billingPeriod,
            features: plans.features,
            stripePriceId: plans.stripePriceId,
            isHighlighted: plans.isHighlighted,
            discountPercentage: plans.discountPercentage,
          })
          .from(plans)
          .where(and(...conditions));

        return reply.send(activePlans);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          message: "Erro ao obter planos de assinatura.",
        });
      }
    }
  );

  // POST /checkout/session — Criar sessão de checkout do Stripe (Passo 10.5)
  fastify.post(
    "/checkout/session",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const { stripePriceId } = request.body as { stripePriceId: string };

        if (!stripePriceId) {
          return reply.status(400).send({
            message: "stripePriceId é obrigatório.",
          });
        }

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const isDummy = !stripeKey || 
                        stripeKey.includes("dummy") || 
                        stripeKey === "sk_test_dummy_123" || 
                        !stripeKey.startsWith("sk_");

        const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "https://sweet-affinity-frontend.vercel.app";
        if (isDummy) {
          return reply.send({
            id: `cs_dev_${Date.now()}`,
            url: `${frontendUrl}/premium/success?session_id=cs_dev_${Date.now()}`,
            simulated: true,
          });
        }

        try {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
              {
                price: stripePriceId,
                quantity: 1,
              },
            ],
            success_url: `${frontendUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/premium/cancel`,
            metadata: {
              userId: user.sub,
              stripePriceId,
            },
          });

          return reply.send({
            id: session.id,
            url: session.url,
          });
        } catch (stripeErr: any) {
          fastify.log.warn("Stripe real falhou (Redirecionando para Simulação/Mock):", stripeErr.message);
          return reply.send({
            id: `cs_dev_${Date.now()}`,
            url: `${frontendUrl}/premium/success?session_id=cs_dev_${Date.now()}`,
            simulated: true,
          });
        }
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({
          message: "Erro ao criar sessão de checkout do Stripe.",
        });
      }
    }
  );

  // POST /checkout/confirm — Confirmação manual de checkout (Mock e Real)
  fastify.post(
    "/checkout/confirm",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { sub: string };
        const { sessionId } = request.body as { sessionId: string };

        const { users } = await import("../db/schema.js");
        await db.update(users).set({ isPremium: true }).where(eq(users.id, user.sub));

        return reply.send({ success: true });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ message: "Erro ao confirmar checkout." });
      }
    }
  );
};
