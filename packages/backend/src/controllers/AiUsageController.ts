import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { aiUsageLogs, aiBudgetConfig, notifications, users } from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { requirePermission } from "../middleware/rbac.js";

// Tabela de preços por modelo (USD por 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o":              { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":         { input: 0.15,  output: 0.60  },
  "gpt-4-turbo":         { input: 10.00, output: 30.00 },
  "gemini-1.5-pro":      { input: 1.25,  output: 5.00  },
  "gemini-1.5-flash":    { input: 0.075, output: 0.30  },
  "gemini-2.0-flash":    { input: 0.10,  output: 0.40  },
  "claude-3.5-sonnet":   { input: 3.00,  output: 15.00 },
  "claude-3-haiku":      { input: 0.25,  output: 1.25  },
};

/**
 * Calcula o custo estimado de uma chamada de IA
 */
export function calcAiCost(model: string, promptTokens: number, completionTokens: number) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return { costUsd: 0 };
  const costUsd =
    (promptTokens / 1_000_000) * pricing.input +
    (completionTokens / 1_000_000) * pricing.output;
  return { costUsd };
}

/**
 * Middleware/helper para logar uso de IA automaticamente.
 * Use em qualquer feature que chame uma API de LLM.
 */
export async function logAiUsage(params: {
  service: string;
  model: string;
  feature: string;
  promptTokens: number;
  completionTokens: number;
  userId?: string;
  requestId?: string;
  status?: "success" | "error" | "timeout";
  latencyMs?: number;
  exchangeRateBrl?: number; // taxa USD->BRL (padrão: 5.0)
}) {
  try {
    const { costUsd } = calcAiCost(params.model, params.promptTokens, params.completionTokens);
    const rate = params.exchangeRateBrl ?? 5.0;
    const costBrl = costUsd * rate;

    await db.insert(aiUsageLogs).values({
      service: params.service,
      model: params.model,
      feature: params.feature,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.promptTokens + params.completionTokens,
      costUsd,
      costBrl,
      userId: params.userId,
      requestId: params.requestId,
      status: params.status ?? "success",
      latencyMs: params.latencyMs,
    });

    // Verificar budget após cada chamada
    await checkBudgetAlert(params.service);
  } catch (err) {
    // Silencioso — não deve travar a feature principal
    console.error("[AI Logger] Falha ao registrar uso:", err);
  }
}

/**
 * Verifica se o uso diário ultrapassou o threshold de alerta
 */
async function checkBudgetAlert(service: string) {
  try {
    const [budget] = await db
      .select()
      .from(aiBudgetConfig)
      .where(eq(aiBudgetConfig.service, service))
      .limit(1);

    if (!budget || !budget.isEnabled) return;

    const todayResult = await db.execute(sql`
      SELECT COALESCE(SUM(cost_usd), 0) as total
      FROM ai_usage_logs
      WHERE service = ${service}
        AND created_at >= CURRENT_DATE
    `);

    const totalToday = Number(todayResult.rows[0]?.total ?? 0);
    const usedPercent = (totalToday / budget.dailyLimitUsd) * 100;

    if (usedPercent >= budget.alertThreshold) {
      // Notificar todos os admins
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.profileType, "admin"));

      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "system",
          title: `⚠️ Alerta de Budget IA — ${service}`,
          body: `Consumo diário de ${service} atingiu ${usedPercent.toFixed(1)}% do limite ($${totalToday.toFixed(4)} / $${budget.dailyLimitUsd}).`,
          link: "/admin/ai-control",
        });
      }
    }
  } catch (err) {
    console.error("[AI Budget Check] Erro:", err);
  }
}

export async function aiUsageRoutes(app: FastifyInstance) {

  // =====================================================
  // GET /admin/ai/usage
  // Log detalhado de uso de IA com filtros
  // =====================================================
  app.get("/usage", {
    preHandler: [requirePermission("ai.view")]
  }, async (req: any, reply: FastifyReply) => {
    const {
      service,
      feature,
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString(),
      limit = 50,
      offset = 0,
    } = req.query as {
      service?: string;
      feature?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    };

    try {
      const conditions = [`created_at BETWEEN '${from}' AND '${to}'`];
      if (service) conditions.push(`service = '${service}'`);
      if (feature) conditions.push(`feature = '${feature}'`);
      const where = conditions.join(" AND ");

      const result = await db.execute(sql.raw(`
        SELECT id, service, model, feature, prompt_tokens, completion_tokens,
               total_tokens, cost_usd, cost_brl, status, latency_ms, created_at
        FROM ai_usage_logs
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `));

      const totalResult = await db.execute(sql.raw(`
        SELECT count(*) FROM ai_usage_logs WHERE ${where}
      `));

      return reply.send({
        data: result.rows,
        total: Number(totalResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar logs de IA." });
    }
  });

  // =====================================================
  // GET /admin/ai/costs
  // Custos agregados por dia, serviço e modelo
  // =====================================================
  app.get("/costs", {
    preHandler: [requirePermission("ai.view")]
  }, async (req: any, reply: FastifyReply) => {
    const {
      period = "30d",
    } = req.query as { period?: "7d" | "30d" | "90d" };

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

    try {
      // Custo total hoje
      const todayResult = await db.execute(sql`
        SELECT
          COALESCE(SUM(cost_usd), 0) as cost_usd,
          COALESCE(SUM(cost_brl), 0) as cost_brl,
          COALESCE(SUM(total_tokens), 0) as total_tokens,
          COUNT(*) as calls
        FROM ai_usage_logs
        WHERE created_at >= CURRENT_DATE
      `);

      // Custo este mês
      const monthResult = await db.execute(sql`
        SELECT
          COALESCE(SUM(cost_usd), 0) as cost_usd,
          COALESCE(SUM(cost_brl), 0) as cost_brl,
          COALESCE(SUM(total_tokens), 0) as total_tokens
        FROM ai_usage_logs
        WHERE created_at >= DATE_TRUNC('month', NOW())
      `);

      // Por serviço no período
      const byServiceResult = await db.execute(sql`
        SELECT
          service,
          model,
          COALESCE(SUM(cost_usd), 0) as cost_usd,
          COALESCE(SUM(cost_brl), 0) as cost_brl,
          COALESCE(SUM(total_tokens), 0) as total_tokens,
          COUNT(*) as calls,
          ROUND(AVG(latency_ms)) as avg_latency_ms
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY service, model
        ORDER BY cost_usd DESC
      `);

      // Série temporal (por dia)
      const timeSeriesResult = await db.execute(sql`
        SELECT
          DATE_TRUNC('day', created_at) AS day,
          service,
          COALESCE(SUM(cost_usd), 0) as cost_usd,
          COALESCE(SUM(total_tokens), 0) as total_tokens
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY day, service
        ORDER BY day ASC
      `);

      // Por feature
      const byFeatureResult = await db.execute(sql`
        SELECT
          feature,
          COALESCE(SUM(cost_usd), 0) as cost_usd,
          COUNT(*) as calls
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY feature
        ORDER BY cost_usd DESC
      `);

      const today = todayResult.rows[0] as any;
      const month = monthResult.rows[0] as any;

      return reply.send({
        today: {
          costUsd: Number(today.cost_usd),
          costBrl: Number(today.cost_brl),
          totalTokens: Number(today.total_tokens),
          calls: Number(today.calls),
        },
        thisMonth: {
          costUsd: Number(month.cost_usd),
          costBrl: Number(month.cost_brl),
          totalTokens: Number(month.total_tokens),
        },
        byService: byServiceResult.rows.map((r: any) => ({
          service: r.service,
          model: r.model,
          costUsd: Number(r.cost_usd),
          costBrl: Number(r.cost_brl),
          totalTokens: Number(r.total_tokens),
          calls: Number(r.calls),
          avgLatencyMs: Number(r.avg_latency_ms),
        })),
        byFeature: byFeatureResult.rows.map((r: any) => ({
          feature: r.feature,
          costUsd: Number(r.cost_usd),
          calls: Number(r.calls),
        })),
        timeSeries: timeSeriesResult.rows.map((r: any) => ({
          day: r.day,
          service: r.service,
          costUsd: Number(r.cost_usd),
          totalTokens: Number(r.total_tokens),
        })),
        modelPricing: MODEL_PRICING,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao calcular custos de IA." });
    }
  });

  // =====================================================
  // GET /admin/ai/budget
  // Configurações de orçamento por serviço
  // =====================================================
  app.get("/budget", {
    preHandler: [requirePermission("ai.view")]
  }, async (_req: any, reply: FastifyReply) => {
    try {
      const configs = await db.select().from(aiBudgetConfig);

      // Enriquece com uso atual do dia
      const enriched = await Promise.all(configs.map(async (cfg) => {
        const todayResult = await db.execute(sql`
          SELECT COALESCE(SUM(cost_usd), 0) as total
          FROM ai_usage_logs
          WHERE service = ${cfg.service} AND created_at >= CURRENT_DATE
        `);
        const todayUsd = Number(todayResult.rows[0]?.total ?? 0);
        const usedPercent = (todayUsd / cfg.dailyLimitUsd) * 100;

        return {
          ...cfg,
          todayUsedUsd: todayUsd,
          dailyUsedPercent: usedPercent.toFixed(1),
          isOverBudget: usedPercent >= 100,
          isNearLimit: usedPercent >= cfg.alertThreshold,
        };
      }));

      return reply.send({ budgets: enriched });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao buscar configurações de budget." });
    }
  });

  // =====================================================
  // PUT /admin/ai/budget/:service
  // Atualiza limites de orçamento de um serviço
  // =====================================================
  app.put("/budget/:service", {
    preHandler: [requirePermission("ai.config")]
  }, async (req: any, reply: FastifyReply) => {
    const { service } = req.params as { service: string };
    const { dailyLimitUsd, monthlyLimitUsd, alertThreshold, isEnabled } = req.body as {
      dailyLimitUsd?: number;
      monthlyLimitUsd?: number;
      alertThreshold?: number;
      isEnabled?: boolean;
    };

    try {
      const [existing] = await db
        .select()
        .from(aiBudgetConfig)
        .where(eq(aiBudgetConfig.service, service))
        .limit(1);

      const updateData: any = {};
      if (dailyLimitUsd !== undefined) updateData.dailyLimitUsd = dailyLimitUsd;
      if (monthlyLimitUsd !== undefined) updateData.monthlyLimitUsd = monthlyLimitUsd;
      if (alertThreshold !== undefined) updateData.alertThreshold = alertThreshold;
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

      if (existing) {
        await db.update(aiBudgetConfig).set(updateData).where(eq(aiBudgetConfig.service, service));
      } else {
        await db.insert(aiBudgetConfig).values({
          service,
          dailyLimitUsd: dailyLimitUsd ?? 5.0,
          monthlyLimitUsd: monthlyLimitUsd ?? 50.0,
          alertThreshold: alertThreshold ?? 80,
          isEnabled: isEnabled ?? true,
        });
      }

      return reply.send({ success: true, message: `Budget de '${service}' atualizado.` });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao atualizar budget de IA." });
    }
  });
}
