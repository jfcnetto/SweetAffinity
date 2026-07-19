'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Users, TrendingUp, DollarSign, AlertTriangle,
  Shield, Cpu, MessageSquare, Settings,
  BarChart2, UserCheck, BanIcon, Star,
  RefreshCw, ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface DashboardData {
  totalActiveUsers: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  totalMatches: number;
  pendingReports: number;
}

interface AiCosts {
  today: { costUsd: number; costBrl: number; totalTokens: number; calls: number };
  thisMonth: { costUsd: number; costBrl: number; totalTokens: number };
}

const NAV_ITEMS = [
  { icon: BarChart2,     label: 'Dashboard',       href: '/admin',                active: true },
  { icon: Users,         label: 'Usuários',         href: '/admin/users' },
  { icon: DollarSign,    label: 'Financeiro',       href: '/admin/finance' },
  { icon: Cpu,           label: 'Controle de IA',   href: '/admin/ai' },
  { icon: Shield,        label: 'Acessos',          href: '/admin/access' },
  { icon: AlertTriangle, label: 'Denúncias',        href: '/admin/reports' },
  { icon: MessageSquare, label: 'Comunicações',     href: '/admin/communications' },
  { icon: Settings,      label: 'Configurações',    href: '/admin/settings' },
];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'pink',
  alert = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  alert?: boolean;
}) {
  const colors: Record<string, string> = {
    pink:   'from-pink-500 to-rose-600',
    blue:   'from-blue-500 to-indigo-600',
    green:  'from-emerald-500 to-teal-600',
    amber:  'from-amber-500 to-orange-600',
    purple: 'from-violet-500 to-purple-700',
    red:    'from-red-500 to-rose-700',
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border ${alert ? 'border-red-200' : 'border-gray-100'} p-5 hover:shadow-md transition group`}>
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
      {alert && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  );
}

export default function AdminCRMDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiCosts, setAiCosts] = useState<AiCosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '');

  const fetchDashboard = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [dashRes, aiRes] = await Promise.allSettled([
        axios.get(`${API_URL}/admin/dashboard`, { headers }),
        axios.get(`${API_URL}/admin/ai/costs?period=7d`, { headers }),
      ]);

      if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
      if (aiRes.status === 'fulfilled') setAiCosts(aiRes.value.data);
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Polling de 60s
    const interval = setInterval(fetchDashboard, 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const fmt = (n: number, decimals = 0) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
            ))}
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Receita & Crescimento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard
                  icon={DollarSign}
                  label="MRR"
                  value={fmtBRL(data?.mrr ?? 0)}
                  sub="Receita Recorrente Mensal"
                  color="green"
                />
                <KpiCard
                  icon={TrendingUp}
                  label="ARR"
                  value={fmtBRL(data?.arr ?? 0)}
                  sub="Projeção Anual"
                  color="blue"
                />
                <KpiCard
                  icon={UserCheck}
                  label="Assinaturas Ativas"
                  value={fmt(data?.activeSubscriptions ?? 0)}
                  sub="Premium + Diamante"
                  color="purple"
                />
                <KpiCard
                  icon={Users}
                  label="Usuários Ativos"
                  value={fmt(data?.totalActiveUsers ?? 0)}
                  sub="Status: active"
                  color="pink"
                />
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Operação & Moderação</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard
                  icon={AlertTriangle}
                  label="Denúncias Pendentes"
                  value={fmt(data?.pendingReports ?? 0)}
                  sub="Aguardando moderação"
                  color="red"
                  alert={(data?.pendingReports ?? 0) > 0}
                />
                <KpiCard
                  icon={Star}
                  label="Total de Matches"
                  value={fmt(data?.totalMatches ?? 0)}
                  sub="Histórico completo"
                  color="amber"
                />
                <KpiCard
                  icon={Cpu}
                  label="Custo IA Hoje"
                  value={`$${(aiCosts?.today.costUsd ?? 0).toFixed(4)}`}
                  sub={`≈ ${fmtBRL(aiCosts?.today.costBrl ?? 0)}`}
                  color="blue"
                />
                <KpiCard
                  icon={Cpu}
                  label="Tokens Hoje"
                  value={fmt(aiCosts?.today.totalTokens ?? 0)}
                  sub={`${fmt(aiCosts?.today.calls ?? 0)} chamadas de API`}
                  color="purple"
                />
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Ver Denúncias', href: '/admin/reports', icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-100' },
                  { label: 'Fluxo de Caixa', href: '/admin/finance', icon: DollarSign, color: 'bg-green-50 text-green-700 border-green-100' },
                  { label: 'Controle de IA', href: '/admin/ai', icon: Cpu, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Acessos Especiais', href: '/admin/access', icon: Shield, color: 'bg-purple-50 text-purple-700 border-purple-100' },
                  { label: 'Campanha', href: '/admin/communications', icon: MessageSquare, color: 'bg-pink-50 text-pink-700 border-pink-100' },
                  { label: 'Usuários', href: '/admin/users', icon: Users, color: 'bg-gray-50 text-gray-700 border-gray-200' },
                  { label: 'Configurações', href: '/admin/settings', icon: Settings, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Banir Usuário', href: '/admin/users?action=ban', icon: BanIcon, color: 'bg-red-50 text-red-700 border-red-100' },
                ].map((action) => (
                  <button
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    className={`flex items-center justify-between p-4 bg-white rounded-xl border ${action.color} hover:shadow-sm transition text-sm font-medium`}
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            </section>

            {/* IA Cost Summary */}
            {aiCosts && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Resumo IA — Este Mês</h3>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Custo Total (USD)</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">${aiCosts.thisMonth.costUsd.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Custo Total (BRL)</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{fmtBRL(aiCosts.thisMonth.costBrl)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Total de Tokens</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(aiCosts.thisMonth.totalTokens)}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
    </div>
  );
}
