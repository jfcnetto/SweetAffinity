import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { aiUsageLogs, aiBudgetConfig, notifications, users } from "../db/schema.js";
import { eq, and, gte, lte, desc, sum, count, avg } from "drizzle-orm";
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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayResult] = await db
      .select({ total: sum(aiUsageLogs.costUsd) })
      .from(aiUsageLogs)
      .where(and(
         eq(aiUsageLogs.service, service),
         gte(aiUsageLogs.createdAt, startOfToday)
      ));

    const totalToday = Number(todayResult?.total ?? 0);
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
      const conditions = [];
      conditions.push(gte(aiUsageLogs.createdAt, new Date(from)));
      conditions.push(lte(aiUsageLogs.createdAt, new Date(to)));
      if (service) conditions.push(eq(aiUsageLogs.service, service));
      if (feature) conditions.push(eq(aiUsageLogs.feature, feature));

      const logsResult = await db
        .select()
        .from(aiUsageLogs)
        .where(and(...conditions))
        .orderBy(desc(aiUsageLogs.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const [totalResult] = await db
        .select({ total: count() })
        .from(aiUsageLogs)
        .where(and(...conditions));

      return reply.send({
        data: logsResult,
        total: Number(totalResult?.total ?? 0),
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
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [todayResult] = await db
        .select({
          costUsd: sum(aiUsageLogs.costUsd),
          costBrl: sum(aiUsageLogs.costBrl),
          totalTokens: sum(aiUsageLogs.totalTokens),
          calls: count(),
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, startOfToday));

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [monthResult] = await db
        .select({
          costUsd: sum(aiUsageLogs.costUsd),
          costBrl: sum(aiUsageLogs.costBrl),
          totalTokens: sum(aiUsageLogs.totalTokens),
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, startOfMonth));

      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - days);

      // Usando Drizzle puro para byService
      const byServiceQuery = await db
        .select({
          service: aiUsageLogs.service,
          model: aiUsageLogs.model,
          costUsd: sum(aiUsageLogs.costUsd),
          costBrl: sum(aiUsageLogs.costBrl),
          totalTokens: sum(aiUsageLogs.totalTokens),
          calls: count(),
          avgLatencyMs: avg(aiUsageLogs.latencyMs)
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, periodStart))
        .groupBy(aiUsageLogs.service, aiUsageLogs.model);
      
      byServiceQuery.sort((a, b) => Number(b.costUsd ?? 0) - Number(a.costUsd ?? 0));

      // Buscar todos do periodo para processar byFeature e timeSeries em memória sem DATE_TRUNC
      const allPeriodLogs = await db
        .select({
          service: aiUsageLogs.service,
          feature: aiUsageLogs.feature,
          costUsd: aiUsageLogs.costUsd,
          totalTokens: aiUsageLogs.totalTokens,
          createdAt: aiUsageLogs.createdAt
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, periodStart));

      // By Feature
      const featureMap = new Map<string, { costUsd: number; calls: number }>();
      // Time Series
      const timeSeriesMap = new Map<string, { costUsd: number; totalTokens: number }>();

      for (const log of allPeriodLogs) {
        const costUsd = Number(log.costUsd ?? 0);
        
        // Feature logic
        const feature = log.feature || "unknown";
        if (!featureMap.has(feature)) featureMap.set(feature, { costUsd: 0, calls: 0 });
        const featStats = featureMap.get(feature)!;
        featStats.costUsd += costUsd;
        featStats.calls += 1;

        // TimeSeries logic
        const dateKey = new Date(log.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
        const tsKey = `${dateKey}_${log.service}`;
        if (!timeSeriesMap.has(tsKey)) timeSeriesMap.set(tsKey, { costUsd: 0, totalTokens: 0 });
        const tsStats = timeSeriesMap.get(tsKey)!;
        tsStats.costUsd += costUsd;
        tsStats.totalTokens += Number(log.totalTokens ?? 0);
      }

      const byFeatureResult = Array.from(featureMap.entries()).map(([feature, stats]) => ({
        feature,
        costUsd: stats.costUsd,
        calls: stats.calls
      })).sort((a, b) => b.costUsd - a.costUsd);

      const timeSeriesResult = Array.from(timeSeriesMap.entries()).map(([key, stats]) => {
        const [day, service] = key.split("_");
        return {
          day,
          service,
          costUsd: stats.costUsd,
          totalTokens: stats.totalTokens
        };
      }).sort((a, b) => a.day.localeCompare(b.day));

      return reply.send({
        today: {
          costUsd: Number(todayResult?.costUsd ?? 0),
          costBrl: Number(todayResult?.costBrl ?? 0),
          totalTokens: Number(todayResult?.totalTokens ?? 0),
          calls: Number(todayResult?.calls ?? 0),
        },
        thisMonth: {
          costUsd: Number(monthResult?.costUsd ?? 0),
          costBrl: Number(monthResult?.costBrl ?? 0),
          totalTokens: Number(monthResult?.totalTokens ?? 0),
        },
        byService: byServiceQuery.map((r) => ({
          service: r.service,
          model: r.model,
          costUsd: Number(r.costUsd ?? 0),
          costBrl: Number(r.costBrl ?? 0),
          totalTokens: Number(r.totalTokens ?? 0),
          calls: Number(r.calls ?? 0),
          avgLatencyMs: Number(r.avgLatencyMs ?? 0),
        })),
        byFeature: byFeatureResult,
        timeSeries: timeSeriesResult,
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
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [todayResult] = await db
          .select({ total: sum(aiUsageLogs.costUsd) })
          .from(aiUsageLogs)
          .where(and(
             eq(aiUsageLogs.service, cfg.service),
             gte(aiUsageLogs.createdAt, startOfToday)
          ));
        const todayUsd = Number(todayResult?.total ?? 0);
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
