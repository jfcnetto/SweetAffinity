"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Bell,
  Send,
  Plus,
  Eye,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  PauseCircle,
  FileEdit,
  X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Campaign {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  notification_title: string | null;
  notification_body: string | null;
  status: string;
  scheduled_for: string | null;
  sent_count: number;
  opened_count: number;
  sent_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400", icon: <FileEdit className="w-3.5 h-3.5" /> },
  scheduled: { label: "Agendada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Clock className="w-3.5 h-3.5" /> },
  sending: { label: "Enviando", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Send className="w-3.5 h-3.5" /> },
  sent: { label: "Enviada", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  paused: { label: "Pausada", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", icon: <PauseCircle className="w-3.5 h-3.5" /> },
};

export default function AdminCommunicationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<"email" | "push">("email");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPushTitle, setFormPushTitle] = useState("");
  const [formPushBody, setFormPushBody] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/communications/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleCreate = async () => {
    try {
      const body: Record<string, unknown> = {
        title: formTitle,
        type: formType,
      };
      if (formType === "email") {
        body.subject = formSubject;
        body.bodyHtml = formBody;
      } else {
        body.notificationTitle = formPushTitle;
        body.notificationBody = formPushBody;
      }

      const res = await fetch(`${API}/admin/communications/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormTitle(""); setFormSubject(""); setFormBody(""); setFormPushTitle(""); setFormPushBody("");
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("Enviar esta campanha agora?")) return;
    try {
      await fetch(`${API}/admin/communications/campaigns/${id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comunicações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Campanhas de e-mail e notificações push em massa</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: campaigns.length, icon: Mail, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Enviadas", value: campaigns.filter(c => c.status === "sent").length, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Agendadas", value: campaigns.filter(c => c.status === "scheduled").length, icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Rascunhos", value: campaigns.filter(c => c.status === "draft").length, icon: FileEdit, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className={`p-2 rounded-xl ${stat.bg} w-fit`}><Icon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500">Nenhuma campanha criada.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {campaigns.map((campaign) => {
              const status = statusConfig[campaign.status] ?? statusConfig.draft;
              const openRate = campaign.sent_count > 0 ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1) : "0";

              return (
                <div key={campaign.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded bg-gray-100 dark:bg-gray-700">
                        {campaign.type === "email" ? <Mail className="w-3.5 h-3.5 text-gray-500" /> : <Bell className="w-3.5 h-3.5 text-gray-500" />}
                      </span>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{campaign.title}</h3>
                    </div>
                    {campaign.subject && <p className="text-xs text-gray-500 truncate">Assunto: {campaign.subject}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">
                      Criada em {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                      {campaign.sent_at && ` • Enviada em ${new Date(campaign.sent_at).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {campaign.sent_count > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.sent_count}</p>
                        <p className="text-[10px] text-gray-500">enviados</p>
                      </div>
                    )}
                    {campaign.sent_count > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-emerald-600">{openRate}%</p>
                        <p className="text-[10px] text-gray-500">abertura</p>
                      </div>
                    )}

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      {status.icon} {status.label}
                    </span>

                    {campaign.status === "draft" && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        className="p-2 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        title="Enviar agora"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nova Campanha</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título da Campanha</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Promoção de Verão" className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
                <div className="flex gap-2">
                  {(["email", "push"] as const).map(t => (
                    <button key={t} onClick={() => setFormType(t)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl border transition-all ${formType === t ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"}`}>
                      {t === "email" ? <Mail className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      {t === "email" ? "E-mail" : "Push"}
                    </button>
                  ))}
                </div>
              </div>

              {formType === "email" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assunto</label>
                    <input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Assunto do e-mail" className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Conteúdo HTML</label>
                    <textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={5} placeholder="<h1>Olá!</h1><p>Conteúdo...</p>" className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none outline-none focus:ring-2 focus:ring-purple-500 font-mono" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título da Notificação</label>
                    <input type="text" value={formPushTitle} onChange={e => setFormPushTitle(e.target.value)} placeholder="Título push" className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Corpo da Notificação</label>
                    <textarea value={formPushBody} onChange={e => setFormPushBody(e.target.value)} rows={3} placeholder="Corpo da mensagem push" className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={handleCreate} disabled={!formTitle.trim()} className="px-6 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors">Criar Rascunho</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
