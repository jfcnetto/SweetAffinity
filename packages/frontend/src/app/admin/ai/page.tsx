"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Cpu,
  DollarSign,
  Zap,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Settings,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AiLog {
  id: string;
  service: string;
  model: string;
  feature: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  cost_brl: number;
  status: string;
  latency_ms: number;
  created_at: string;
}

interface AiBudget {
  id: string;
  service: string;
  daily_limit_usd: number;
  monthly_limit_usd: number;
  alert_threshold: number;
  is_enabled: boolean;
}

interface AiSummary {
  totalCostUsd: number;
  totalCostBrl: number;
  totalTokens: number;
  totalRequests: number;
  avgLatencyMs: number;
  byService: Record<string, { costUsd: number; tokens: number; count: number }>;
}

export default function AdminAiPage() {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [budgets, setBudgets] = useState<AiBudget[]>([]);
  const [summary, setSummary] = useState<AiSummary>({
    totalCostUsd: 0, totalCostBrl: 0, totalTokens: 0, totalRequests: 0, avgLatencyMs: 0, byService: {},
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [activeView, setActiveView] = useState<"logs" | "budgets">("logs");

  const token = typeof window !== "undefined" ? localStorage.getItem("sweet_access_token") || "" : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, budgetsRes] = await Promise.all([
        fetch(`${API}/admin/ai/usage?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/ai/budgets`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const logsData = logsRes.ok ? await logsRes.json() : [];
      const budgetsData = budgetsRes.ok ? await budgetsRes.json() : [];

      const logsList: AiLog[] = logsData.logs ?? logsData ?? [];
      setLogs(logsList);
      setBudgets(budgetsData.budgets ?? budgetsData ?? []);

      // Calculate summary
      const byService: Record<string, { costUsd: number; tokens: number; count: number }> = {};
      let totalCostUsd = 0, totalCostBrl = 0, totalTokens = 0, totalLatency = 0;
      logsList.forEach((l) => {
        totalCostUsd += l.cost_usd || 0;
        totalCostBrl += l.cost_brl || 0;
        totalTokens += l.total_tokens || 0;
        totalLatency += l.latency_ms || 0;
        if (!byService[l.service]) byService[l.service] = { costUsd: 0, tokens: 0, count: 0 };
        byService[l.service].costUsd += l.cost_usd || 0;
        byService[l.service].tokens += l.total_tokens || 0;
        byService[l.service].count += 1;
      });
      setSummary({
        totalCostUsd, totalCostBrl, totalTokens,
        totalRequests: logsList.length,
        avgLatencyMs: logsList.length > 0 ? Math.round(totalLatency / logsList.length) : 0,
        byService,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpiCards = [
    {
      label: "Custo Total (USD)",
      value: `$${summary.totalCostUsd.toFixed(4)}`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Custo Total (BRL)",
      value: `R$ ${summary.totalCostBrl.toFixed(2).replace(".", ",")}`,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Tokens Consumidos",
      value: summary.totalTokens.toLocaleString("pt-BR"),
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Requisições",
      value: String(summary.totalRequests),
      icon: Cpu,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const serviceColors: Record<string, string> = {
    openai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    gemini: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    anthropic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de IA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consumo de tokens, custos por modelo e orçamentos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className={`p-2.5 rounded-xl ${kpi.bg} w-fit`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Service Breakdown */}
      {Object.keys(summary.byService).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Consumo por Serviço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(summary.byService).map(([service, data]) => (
              <div key={service} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${serviceColors[service] || "bg-gray-100 text-gray-600"}`}>
                    {service}
                  </span>
                  <span className="text-xs text-gray-500">{data.count} reqs</span>
                </div>
                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">${data.costUsd.toFixed(4)}</p>
                <p className="text-xs text-gray-500">{data.tokens.toLocaleString("pt-BR")} tokens</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView("logs")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeView === "logs" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          <Bot className="w-4 h-4 inline mr-1.5" /> Logs de Uso
        </button>
        <button
          onClick={() => setActiveView("budgets")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeView === "budgets" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1.5" /> Orçamentos
        </button>
      </div>

      {/* Logs Table */}
      {activeView === "logs" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 outline-none"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Serviço</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Modelo</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Feature</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Tokens</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Custo USD</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Latência</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="py-4 px-5"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400"><Bot className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>Nenhum log de IA registrado.</p></td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${serviceColors[log.service] || "bg-gray-100 text-gray-600"}`}>{log.service}</span>
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-gray-700 dark:text-gray-300">{log.model}</td>
                      <td className="py-3 px-5 text-gray-500 hidden md:table-cell">{log.feature}</td>
                      <td className="py-3 px-5 text-right font-mono text-gray-700 dark:text-gray-300">{log.total_tokens.toLocaleString()}</td>
                      <td className="py-3 px-5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">${(log.cost_usd || 0).toFixed(6)}</td>
                      <td className="py-3 px-5 text-right text-gray-500 hidden lg:table-cell">{log.latency_ms}ms</td>
                      <td className="py-3 px-5 text-gray-500">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budgets View */}
      {activeView === "budgets" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Limites de Orçamento por Serviço</h2>
          {budgets.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum orçamento configurado.</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const dailyUsage = (summary.byService[b.service]?.costUsd || 0);
                const dailyPercent = b.daily_limit_usd > 0 ? Math.min(100, (dailyUsage / b.daily_limit_usd) * 100) : 0;
                const isAlert = dailyPercent >= b.alert_threshold;

                return (
                  <div key={b.id} className="p-5 rounded-xl border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${serviceColors[b.service] || "bg-gray-100 text-gray-600"}`}>
                          {b.service}
                        </span>
                        {isAlert && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> Próximo do limite
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${b.is_enabled ? "text-emerald-600" : "text-gray-400"}`}>
                        {b.is_enabled ? "Ativo" : "Desativado"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Limite Diário</p>
                        <p className="font-semibold text-gray-900 dark:text-white">${b.daily_limit_usd.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Limite Mensal</p>
                        <p className="font-semibold text-gray-900 dark:text-white">${b.monthly_limit_usd.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Uso atual: ${dailyUsage.toFixed(4)}</span>
                        <span>{dailyPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isAlert ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${dailyPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
