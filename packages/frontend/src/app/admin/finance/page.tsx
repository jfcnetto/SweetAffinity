"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  Receipt,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FinancialEvent {
  id: string;
  type: string;
  amount_cents: number;
  currency: string;
  description: string;
  user_id: string | null;
  stripe_event_id: string | null;
  recorded_at: string;
}

interface FinanceSummary {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
}

export default function AdminFinancePage() {
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({ totalRevenue: 0, totalRefunds: 0, netRevenue: 0, transactionCount: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [typeFilter, setTypeFilter] = useState("all");

  const token = typeof window !== "undefined" ? localStorage.getItem("sweet_access_token") || "" : "";

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`${API}/admin/finance/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao carregar dados financeiros");
      const data = await res.json();

      const evts: FinancialEvent[] = data.events ?? data ?? [];
      setEvents(evts);

      // Calculate summary
      let revenue = 0, refunds = 0;
      evts.forEach((e) => {
        if (e.type === "revenue" || e.type === "subscription_payment") revenue += e.amount_cents;
        else if (e.type === "refund") refunds += e.amount_cents;
      });
      setSummary({
        totalRevenue: revenue,
        totalRefunds: refunds,
        netRevenue: revenue - refunds,
        transactionCount: evts.length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, typeFilter, token]);

  useEffect(() => { fetchFinance(); }, [fetchFinance]);

  const formatBRL = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  const kpiCards = [
    {
      label: "Receita Bruta",
      value: formatBRL(summary.totalRevenue),
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      trend: "+12.3%",
      trendUp: true,
    },
    {
      label: "Estornos / Reembolsos",
      value: formatBRL(summary.totalRefunds),
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      trend: "-2.1%",
      trendUp: false,
    },
    {
      label: "Receita Líquida",
      value: formatBRL(summary.netRevenue),
      icon: DollarSign,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      trend: "+10.5%",
      trendUp: true,
    },
    {
      label: "Transações",
      value: String(summary.transactionCount),
      icon: Receipt,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      trend: "+8",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro & Assinaturas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fluxo de caixa e controle de receitas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFinance}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            onClick={async () => {
              try {
                const now = new Date();
                const fromDate = period === "7d"
                  ? new Date(now.getTime() - 7 * 86400000)
                  : period === "90d"
                  ? new Date(now.getTime() - 90 * 86400000)
                  : period === "all"
                  ? new Date(2020, 0, 1)
                  : new Date(now.getTime() - 30 * 86400000);
                const params = new URLSearchParams({
                  from: fromDate.toISOString(),
                  to: now.toISOString(),
                });
                const res = await fetch(`${API}/admin/finance/export?${params}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Erro ao exportar");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `financeiro-${fromDate.toISOString().split("T")[0]}-${now.toISOString().split("T")[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error("Erro ao exportar CSV:", err);
              }
            }}
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trendUp ? "text-emerald-600" : "text-red-500"}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {kpi.trend}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Period & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todo período</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "revenue", "refund", "subscription_payment", "payout"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  typeFilter === t
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {t === "all" ? "Todos" : t === "subscription_payment" ? "Assinatura" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Descrição</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Stripe ID</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-4 px-5" colSpan={5}>
                      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum evento financeiro encontrado.</p>
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        ev.type === "revenue" || ev.type === "subscription_payment"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : ev.type === "refund"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className={`py-3.5 px-5 text-right font-mono font-semibold ${
                      ev.type === "refund" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {ev.type === "refund" ? "-" : "+"}{formatBRL(ev.amount_cents)}
                    </td>
                    <td className="py-3.5 px-5 text-gray-600 dark:text-gray-300 hidden md:table-cell">{ev.description || "—"}</td>
                    <td className="py-3.5 px-5 text-gray-400 font-mono text-xs hidden lg:table-cell">{ev.stripe_event_id?.slice(0, 16) || "—"}</td>
                    <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400">{new Date(ev.recorded_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
