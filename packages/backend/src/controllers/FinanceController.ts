import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  financialEvents,
  subscriptions,
  users,
} from "../db/schema.js";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import Stripe from "stripe";
import { requirePermission } from "../middleware/rbac.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_123", {
  apiVersion: "2024-06-20" as any,
});

export async function financeRoutes(app: FastifyInstance) {

  // =====================================================
  // GET /admin/finance/cashflow
  // Fluxo de caixa por período
  // =====================================================
  app.get("/cashflow", {
    preHandler: [requirePermission("finance.view")]
  }, async (req: any, reply: FastifyReply) => {
    const {
      from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      to = new Date().toISOString(),
      groupBy = "day", // 'day' | 'week' | 'month'
    } = req.query as { from?: string; to?: string; groupBy?: string };

    try {
      // Totais por tipo no período
      const totalsResult = await db.execute(sql`
        SELECT
          type,
          SUM(amount_cents) as total_cents,
          COUNT(*) as count
        FROM financial_events
        WHERE recorded_at BETWEEN ${from} AND ${to}
        GROUP BY type
        ORDER BY type
      `);

      // Receita líquida
      const summaryResult = await db.execute(sql`
        SELECT
          SUM(CASE WHEN type = 'revenue'       THEN amount_cents ELSE 0 END) as revenue,
          SUM(CASE WHEN type = 'refund'        THEN ABS(amount_cents) ELSE 0 END) as refunds,
          SUM(CASE WHEN type = 'chargeback'    THEN ABS(amount_cents) ELSE 0 END) as chargebacks,
          SUM(CASE WHEN type = 'fee'           THEN ABS(amount_cents) ELSE 0 END) as fees,
          SUM(CASE WHEN type = 'manual_credit' THEN amount_cents ELSE 0 END) as manual_credits,
          SUM(CASE WHEN type = 'manual_debit'  THEN ABS(amount_cents) ELSE 0 END) as manual_debits
        FROM financial_events
        WHERE recorded_at BETWEEN ${from} AND ${to}
      `);

      const s = summaryResult.rows[0] as any;
      const revenueCents = Number(s.revenue ?? 0);
      const refundsCents = Number(s.refunds ?? 0);
      const chargebacksCents = Number(s.chargebacks ?? 0);
      const feesCents = Number(s.fees ?? 0);
      const netRevenueCents = revenueCents - refundsCents - chargebacksCents - feesCents;

      // Série temporal (agrupada por período)
      const truncUnit = groupBy === "month" ? "month" : groupBy === "week" ? "week" : "day";
      const timeSeriesResult = await db.execute(sql`
        SELECT
          DATE_TRUNC(${truncUnit}, recorded_at) AS period,
          SUM(CASE WHEN type = 'revenue' THEN amount_cents ELSE 0 END) as revenue,
          SUM(CASE WHEN type IN ('refund','chargeback','fee') THEN ABS(amount_cents) ELSE 0 END) as deductions
        FROM financial_events
        WHERE recorded_at BETWEEN ${from} AND ${to}
        GROUP BY period
        ORDER BY period ASC
      `);

      return reply.send({
        period: { from, to },
        summary: {
          revenueBRL: revenueCents / 100,
          refundsBRL: refundsCents / 100,
          chargebacksBRL: chargebacksCents / 100,
          feesBRL: feesCents / 100,
          netRevenueBRL: netRevenueCents / 100,
        },
        byType: totalsResult.rows.map((r: any) => ({
          type: r.type,
          totalBRL: Number(r.total_cents) / 100,
          count: Number(r.count),
        })),
        timeSeries: timeSeriesResult.rows.map((r: any) => ({
          period: r.period,
          revenueBRL: Number(r.revenue) / 100,
          deductionsBRL: Number(r.deductions) / 100,
          netBRL: (Number(r.revenue) - Number(r.deductions)) / 100,
        })),
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao gerar fluxo de caixa." });
    }
  });

  // =====================================================
  // GET /admin/finance/subscriptions
  // Lista todas as assinaturas com detalhes
  // =====================================================
  app.get("/subscriptions", {
    preHandler: [requirePermission("finance.view")]
  }, async (req: any, reply: FastifyReply) => {
    const { status, planId, limit = 20, offset = 0 } = req.query as {
      status?: string;
      planId?: string;
      limit?: number;
      offset?: number;
    };

    try {
      const conditions = [];
      if (status) conditions.push(sql`s.status = ${status}`);
      if (planId) conditions.push(sql`s.plan_id = ${planId}`);
      const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

      const result = await db.execute(sql`
        SELECT
          s.id,
          s.plan_id,
          s.status,
          s.amount,
          s.current_period_end,
          s.created_at,
          u.email,
          p.display_name
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        LEFT JOIN profiles p ON p.id = s.user_id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `);

      const totalResult = await db.execute(sql`
        SELECT count(*) FROM subscriptions s ${whereClause}
      `);

      return reply.send({
        data: result.rows,
        total: Number(totalResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar assinaturas." });
    }
  });

  // =====================================================
  // POST /admin/finance/refund
  // Emite reembolso via Stripe e registra evento financeiro
  // =====================================================
  app.post("/refund", {
    preHandler: [requirePermission("finance.refund")]
  }, async (req: any, reply: FastifyReply) => {
    const { paymentIntentId, amountCents, reason, userId } = req.body as {
      paymentIntentId: string;
      amountCents?: number;
      reason?: string;
      userId: string;
    };
    const adminUser = req.user as any;

    try {
      const isDummy = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("dummy");

      let refundId = "ref_simulated";

      if (!isDummy) {
        const refundParams: Stripe.RefundCreateParams = {
          payment_intent: paymentIntentId,
          reason: "requested_by_customer",
        };
        if (amountCents) refundParams.amount = amountCents;

        const stripeRefund = await stripe.refunds.create(refundParams);
        refundId = stripeRefund.id;
      }

      // Registrar evento financeiro
      await db.insert(financialEvents).values({
        type: "refund",
        amountCents: -(amountCents ?? 0),
        userId,
        stripeEventId: refundId,
        description: reason ?? "Reembolso administrativo",
        createdBy: adminUser.sub,
      });

      return reply.send({
        success: true,
        refundId,
        message: isDummy ? "Reembolso simulado registrado." : "Reembolso processado via Stripe.",
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao processar reembolso." });
    }
  });

  // =====================================================
  // POST /admin/finance/event (crédito/débito manual)
  // =====================================================
  app.post("/event", {
    preHandler: [requirePermission("finance.refund")] // Assumindo mesma permissão para eventos manuais
  }, async (req: any, reply: FastifyReply) => {
    const { type, amountCents, userId, description } = req.body as {
      type: "manual_credit" | "manual_debit";
      amountCents: number;
      userId?: string;
      description: string;
    };
    const adminUser = req.user as any;

    try {
      const event = await db.insert(financialEvents).values({
        type,
        amountCents: type === "manual_credit" ? amountCents : -amountCents,
        userId,
        description,
        createdBy: adminUser.sub,
      }).returning();

      return reply.status(201).send({ success: true, event: event[0] });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao registrar evento financeiro." });
    }
  });

  // =====================================================
  // GET /admin/finance/export
  // Exporta eventos financeiros como CSV
  // =====================================================
  app.get("/export", {
    preHandler: [requirePermission("finance.export")]
  }, async (req: any, reply: FastifyReply) => {
    const {
      from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      to = new Date().toISOString(),
    } = req.query as { from?: string; to?: string };

    try {
      const result = await db.execute(sql`
        SELECT
          fe.id,
          fe.type,
          fe.amount_cents,
          fe.currency,
          fe.description,
          fe.stripe_event_id,
          fe.recorded_at,
          u.email AS user_email,
          p.display_name AS user_name
        FROM financial_events fe
        LEFT JOIN users u ON u.id = fe.user_id
        LEFT JOIN profiles p ON p.id = fe.user_id
        WHERE fe.recorded_at BETWEEN ${from} AND ${to}
        ORDER BY fe.recorded_at DESC
      `);

      // Gera CSV
      const headers = ["ID", "Tipo", "Valor (BRL)", "Moeda", "Usuário", "Email", "Descrição", "Stripe Event ID", "Data"];
      const rows = result.rows.map((r: any) => [
        r.id,
        r.type,
        (Number(r.amount_cents) / 100).toFixed(2),
        r.currency,
        r.user_name ?? "",
        r.user_email ?? "",
        (r.description ?? "").replace(/,/g, ";"),
        r.stripe_event_id ?? "",
        new Date(r.recorded_at).toLocaleString("pt-BR"),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="financeiro-${from.split("T")[0]}-${to.split("T")[0]}.csv"`);
      return reply.send("\uFEFF" + csv); // BOM para Excel BR
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao exportar dados financeiros." });
    }
  });
}
