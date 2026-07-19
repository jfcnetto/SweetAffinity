"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Crown,
  Star,
  Bot,
  StickyNote,
  Send,
  Trash2,
  Shield,
  Ban,
  UserCheck,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface CrmData {
  user: { id: string; email: string; role: string; status: string; created_at: string };
  profile: { display_name?: string; city?: string; state?: string; bio?: string; gender?: string; birth_date?: string } | null;
  subscriptions: Array<{ id: string; plan_id: string; status: string; amount: number; current_period_end: string; created_at: string }>;
  specialAccess: Array<{ id: string; access_type: string; valid_until: string | null; is_active: boolean; reason: string | null; created_at: string }>;
  financialEvents: Array<{ id: string; type: string; amount_cents: number; currency: string; description: string; recorded_at: string }>;
  crmNotes: Array<{ id: string; content: string; created_at: string; author_name: string }>;
}

export default function UserCrmPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [data, setData] = useState<CrmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "finance" | "subscriptions" | "access">("notes");

  const token = typeof window !== "undefined" ? localStorage.getItem("sweet_access_token") || "" : "";

  const fetchCrm = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/crm`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar ficha CRM");
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchCrm(); }, [fetchCrm]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        fetchCrm();
      }
    } catch { /* ignore */ } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 dark:text-red-400 text-lg">{error || "Dados indisponíveis"}</p>
        <button onClick={() => router.back()} className="mt-4 text-purple-600 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  const { user, profile, subscriptions, specialAccess, financialEvents, crmNotes } = data;
  const displayName = profile?.display_name || user.email.split("@")[0];

  const tabs = [
    { key: "notes" as const, label: "Notas CRM", icon: StickyNote, count: crmNotes.length },
    { key: "finance" as const, label: "Financeiro", icon: CreditCard, count: financialEvents.length },
    { key: "subscriptions" as const, label: "Assinaturas", icon: Crown, count: subscriptions.length },
    { key: "access" as const, label: "Acessos Especiais", icon: Shield, count: specialAccess.length },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para lista
      </button>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-500 border-4 border-white dark:border-gray-800 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 pt-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                {profile?.city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}, {profile.state}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Desde {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                user.status === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : user.status === "banned"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {user.status}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                <Star className="w-3 h-3" /> {user.role}
              </span>
            </div>
          </div>
          {profile?.bio && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 italic">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40 transition-colors">
              <Crown className="w-3.5 h-3.5" /> Conceder Premium
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40 transition-colors">
              <Shield className="w-3.5 h-3.5" /> Perfil Vitalício
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition-colors">
              <UserCheck className="w-3.5 h-3.5" /> Reativar
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors">
              <Ban className="w-3.5 h-3.5" /> Banir
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add Note */}
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escrever nota interna sobre este usuário..."
                  className="flex-1 p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  rows={2}
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}
                  className="self-end px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Salvar
                </button>
              </div>

              {/* Notes List */}
              {crmNotes.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
                  Nenhuma nota registrada ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {crmNotes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Por <b>{note.author_name || "Admin"}</b> em {new Date(note.created_at).toLocaleString("pt-BR")}
                        </span>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === "finance" && (
            <div>
              {financialEvents.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhum evento financeiro registrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialEvents.map((ev) => (
                        <tr key={ev.id} className="border-b border-gray-50 dark:border-gray-700/50">
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              ev.type === "revenue" ? "bg-emerald-100 text-emerald-700" :
                              ev.type === "refund" ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>{ev.type}</span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-medium ${
                            ev.type === "refund" ? "text-red-600" : "text-emerald-600"
                          }`}>
                            {ev.currency === "BRL" ? "R$ " : "$ "}{(ev.amount_cents / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{ev.description || "—"}</td>
                          <td className="py-3 px-4 text-gray-500">{new Date(ev.recorded_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div>
              {subscriptions.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhuma assinatura registrada.</p>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-600 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-500" />
                          Plano: {sub.plan_id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Criada em {new Date(sub.created_at).toLocaleDateString("pt-BR")} • 
                          Expira em {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          R$ {(sub.amount / 100).toFixed(2)}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          sub.status === "active" ? "bg-emerald-100 text-emerald-700" :
                          sub.status === "canceled" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{sub.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Special Access Tab */}
          {activeTab === "access" && (
            <div>
              {specialAccess.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhum acesso especial concedido.</p>
              ) : (
                <div className="space-y-3">
                  {specialAccess.map((acc) => (
                    <div key={acc.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-600 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-500" />
                          {acc.access_type}
                        </p>
                        {acc.reason && <p className="text-xs text-gray-500 mt-1">Motivo: {acc.reason}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Concedido em {new Date(acc.created_at).toLocaleDateString("pt-BR")}
                          {acc.valid_until ? ` • Válido até ${new Date(acc.valid_until).toLocaleDateString("pt-BR")}` : " • Vitalício"}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        acc.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        {acc.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
