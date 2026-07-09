import { FastifyInstance, FastifyReply } from "fastify";
import Stripe from "stripe";
import { db } from "../db/index.js";
import { users, subscriptions, notifications } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// =====================================================
// PLANOS DISPONÍVEIS (Especificação v1.2 - Seção 3.5 / Tabela plans)
// Valores em centavos (BRL) conforme Stripe Brasil
// =====================================================
const PLANS = [
  {
    id: "premium",
    name: "Premium",
    description: "Acesso completo à plataforma. Envie mensagens ilimitadas e veja quem visitou seu perfil.",
    price: 29900, // R$ 299,00
    currency: "brl",
    interval: "month" as const,
    features: [
      "Mensagens ilimitadas",
      "Ver quem visitou seu perfil",
      "Fotos privadas desbloqueadas",
      "Destaque no feed",
      "Suporte prioritário",
    ],
  },
  {
    id: "diamante",
    name: "Diamante",
    description: "O plano mais exclusivo. Tudo do Premium com visibilidade máxima e acesso antecipado a novos recursos.",
    price: 49900, // R$ 499,00
    currency: "brl",
    interval: "month" as const,
    features: [
      "Tudo do Premium",
      "Super Destaque no feed (topo da listagem)",
      "Selo verificado especial",
      "Relatório de popularidade semanal",
      "Acesso antecipado a novos recursos",
    ],
  },
];

// Instância Stripe reutilizando a mesma key do PaymentController
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_123", {
  apiVersion: "2024-06-20" as any,
});

export async function subscriptionRoutes(app: FastifyInstance) {
  // =====================================================
  // AUTH MIDDLEWARE — Obrigatório em todas as rotas abaixo
  // =====================================================
  app.addHook("onRequest", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({ message: "Não autorizado." });
    }
  });

  // =====================================================
  // GET /subscriptions/plans
  // Retorna os planos disponíveis (endpoint público com auth)
  // Spec: GET /subscriptions/plans — Público
  // =====================================================
  app.get("/plans", async (_req, reply: FastifyReply) => {
    return reply.send({ plans: PLANS });
  });

  // =====================================================
  // GET /subscriptions/my
  // Retorna a assinatura ativa do usuário logado
  // =====================================================
  app.get("/my", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, "active")
          )
        )
        .limit(1);

      if (!sub) {
        return reply.send({ subscription: null, isPremium: false });
      }

      return reply.send({
        subscription: sub,
        isPremium: true,
        plan: PLANS.find((p) => p.id === sub.planId) ?? null,
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao buscar assinatura." });
    }
  });

  // =====================================================
  // POST /subscriptions/create
  // Cria uma intenção de pagamento para assinatura Stripe
  // Spec: POST /subscriptions/create — Token JWT
  // =====================================================
  app.post("/create", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;
      const { planId } = req.body as { planId: string };

      // Valida o plano solicitado
      const plan = PLANS.find((p) => p.id === planId);
      if (!plan) {
        return reply.status(400).send({ message: "Plano inválido. Escolha 'premium' ou 'diamante'." });
      }

      // Verifica se já possui assinatura ativa
      const [existingActive] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, "active")
          )
        )
        .limit(1);

      if (existingActive) {
        return reply.status(409).send({
          message: "Você já possui uma assinatura ativa. Cancele-a antes de assinar um novo plano.",
        });
      }

      // Modo simulado (sem chave Stripe real configurada)
      const isDummy = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("dummy");

      if (isDummy) {
        // Aprovação imediata para desenvolvimento/testes
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: `sub_dev_${Date.now()}`,
          stripeCustomerId: `cus_dev_${userId}`,
          status: "active",
          planId: plan.id,
          amount: plan.price,
          currentPeriodEnd: periodEnd,
        });

        await db.update(users).set({ isPremium: true }).where(eq(users.id, userId));

        // Notificação in-app
        await db.insert(notifications).values({
          userId,
          type: "payment",
          title: "Assinatura ativada! 🎉",
          body: `Bem-vindo ao plano ${plan.name}! Aproveite todos os benefícios.`,
          link: "/feed",
        });

        return reply.status(201).send({
          success: true,
          message: `Assinatura ${plan.name} ativada (simulação de desenvolvimento).`,
          simulated: true,
        });
      }

      // Fluxo real — cria PaymentIntent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.price,
        currency: plan.currency,
        metadata: {
          userId,
          planId: plan.id,
        },
      });

      return reply.status(201).send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        plan: {
          id: plan.id,
          name: plan.name,
          amount: plan.price,
        },
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao criar assinatura no Stripe." });
    }
  });

  // =====================================================
  // DELETE /subscriptions/cancel
  // Cancela a assinatura ativa do usuário logado
  // Spec: DELETE /subscriptions/cancel — Token JWT
  // Regra de Negócio: acesso mantido até o fim do período pago
  // =====================================================
  app.delete("/cancel", async (req: any, reply: FastifyReply) => {
    try {
      const userId = req.user.sub;

      // Localiza assinatura ativa do usuário
      const [activeSub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, "active")
          )
        )
        .limit(1);

      if (!activeSub) {
        return reply.status(404).send({ message: "Nenhuma assinatura ativa encontrada." });
      }

      // Cancela na Stripe (se não for modo dev)
      const isDummy = activeSub.stripeSubscriptionId.startsWith("sub_dev_");

      if (!isDummy) {
        // Cancela ao fim do período — usuário mantém acesso até a data de expiração
        await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Atualiza status local para "cancelled"
      await db
        .update(subscriptions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(subscriptions.id, activeSub.id));

      // Remove flag de premium do usuário imediatamente no dev, ou mantém até expirar em produção
      if (isDummy) {
        await db.update(users).set({ isPremium: false }).where(eq(users.id, userId));
      }
      // Em produção, o webhook do Stripe irá desativar isPremium quando customer.subscription.deleted disparar

      // Notificação in-app
      await db.insert(notifications).values({
        userId,
        type: "payment",
        title: "Assinatura cancelada",
        body: `Sua assinatura foi cancelada. Você continuará com acesso premium até ${activeSub.currentPeriodEnd.toLocaleDateString("pt-BR")}.`,
        link: "/plans",
      });

      return reply.send({
        success: true,
        message: "Assinatura cancelada. O acesso premium será mantido até o fim do período pago.",
        accessUntil: activeSub.currentPeriodEnd,
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao cancelar assinatura." });
    }
  });

  // =====================================================
  // POST /subscriptions/webhook
  // Recebe eventos do Stripe (customer.subscription.deleted, invoice.payment_failed)
  // Spec: POST /payments/webhook/stripe — Público (Stripe Signature)
  // =====================================================
  app.post(
    "/webhook",
    async (req: any, reply: FastifyReply) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret || !sig) {
        return reply.status(400).send({ message: "Webhook secret não configurado." });
      }

      // O body chega como string/Buffer quando o Content-Type é application/json
      const rawBody = req.rawBody ?? JSON.stringify(req.body);

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        req.log.error(`Webhook Stripe — Assinatura inválida: ${err.message}`);
        return reply.status(400).send({ message: "Assinatura de webhook inválida." });
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const stripeSubscriptionId = session.subscription as string;
          const stripeCustomerId = session.customer as string;

          if (userId && stripeSubscriptionId) {
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            const periodEnd = new Date(stripeSub.current_period_end * 1000);
            
            const priceId = stripeSub.items.data[0]?.price.id;
            const amount = stripeSub.items.data[0]?.plan?.amount || 0;

            await db.insert(subscriptions).values({
              userId,
              stripeSubscriptionId,
              stripeCustomerId,
              status: "active",
              planId: priceId || "unknown",
              amount,
              currentPeriodEnd: periodEnd,
            });

            await db.update(users).set({ isPremium: true }).where(eq(users.id, userId));

            await db.insert(notifications).values({
              userId,
              type: "payment",
              title: "Assinatura ativada! 🎉",
              body: "Sua assinatura premium foi ativada com sucesso. Aproveite todos os benefícios!",
              link: "/feed",
            });
          }
        }

        if (event.type === "customer.subscription.updated") {
          const stripeSub = event.data.object as Stripe.Subscription;
          const periodEnd = new Date(stripeSub.current_period_end * 1000);

          await db
            .update(subscriptions)
            .set({
              status: stripeSub.status === "active" ? "active" : "expired",
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
            
          if (stripeSub.status !== "active") {
            const [localSub] = await db
              .select({ userId: subscriptions.userId })
              .from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
              .limit(1);
              
            if (localSub) {
              await db.update(users).set({ isPremium: false }).where(eq(users.id, localSub.userId));
            }
          }
        }

        if (event.type === "customer.subscription.deleted") {
          const stripeSub = event.data.object as Stripe.Subscription;

          const [localSub] = await db
            .select({ userId: subscriptions.userId })
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
            .limit(1);

          if (localSub) {
            await db
              .update(subscriptions)
              .set({ status: "expired", updatedAt: new Date() })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));

            await db
              .update(users)
              .set({ isPremium: false })
              .where(eq(users.id, localSub.userId));

            await db.insert(notifications).values({
              userId: localSub.userId,
              type: "payment",
              title: "Assinatura expirada",
              body: "Seu período premium chegou ao fim. Renove para continuar aproveitando os benefícios!",
              link: "/plans",
            });
          }
        }

        if (event.type === "invoice.payment_failed") {
          const invoice = event.data.object as Stripe.Invoice;
          const stripeSubId = (invoice as any).subscription as string | null;

          if (stripeSubId) {
            const [localSub] = await db
              .select({ userId: subscriptions.userId })
              .from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
              .limit(1);

            if (localSub) {
              await db.insert(notifications).values({
                userId: localSub.userId,
                type: "payment",
                title: "Falha no pagamento ⚠️",
                body: "Houve um problema ao renovar sua assinatura. Verifique seus dados de pagamento.",
                link: "/plans",
              });
            }
          }
        }

        return reply.send({ received: true });
      } catch (err: any) {
        req.log.error(err);
        return reply.status(500).send({ message: "Erro ao processar evento do webhook." });
      }
    }
  );
}
