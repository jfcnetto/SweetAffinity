"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Shield,
  Mail,
  Bell,
  Palette,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SettingItem {
  key: string;
  value: unknown;
}

const SETTING_GROUPS = [
  {
    title: "Geral",
    icon: Globe,
    keys: [
      { key: "site_name", label: "Nome do Site", type: "text", default: "SweetAffinity" },
      { key: "site_description", label: "Descrição", type: "text", default: "Plataforma de relacionamentos premium" },
      { key: "maintenance_mode", label: "Modo Manutenção", type: "toggle", default: false },
      { key: "max_users_soft_launch", label: "Limite Soft Launch", type: "number", default: 50 },
    ],
  },
  {
    title: "Segurança",
    icon: Shield,
    keys: [
      { key: "require_email_verification", label: "Exigir Verificação de E-mail", type: "toggle", default: true },
      { key: "max_login_attempts", label: "Tentativas Máximas de Login", type: "number", default: 5 },
      { key: "session_timeout_minutes", label: "Timeout de Sessão (min)", type: "number", default: 60 },
      { key: "enable_2fa", label: "Habilitar 2FA para Admins", type: "toggle", default: false },
    ],
  },
  {
    title: "E-mail",
    icon: Mail,
    keys: [
      { key: "smtp_from_name", label: "Nome do Remetente", type: "text", default: "SweetAffinity" },
      { key: "smtp_from_email", label: "E-mail do Remetente", type: "text", default: "noreply@sweetaffinity.com" },
      { key: "email_notifications_enabled", label: "Notificações por E-mail", type: "toggle", default: true },
    ],
  },
  {
    title: "Notificações Push",
    icon: Bell,
    keys: [
      { key: "push_enabled", label: "Push Notifications", type: "toggle", default: true },
      { key: "push_new_match", label: "Notificar Novos Matches", type: "toggle", default: true },
      { key: "push_new_message", label: "Notificar Novas Mensagens", type: "toggle", default: true },
    ],
  },
  {
    title: "Aparência",
    icon: Palette,
    keys: [
      { key: "primary_color", label: "Cor Primária", type: "color", default: "#8B5CF6" },
      { key: "accent_color", label: "Cor de Destaque", type: "color", default: "#EC4899" },
      { key: "dark_mode_default", label: "Dark Mode Padrão", type: "toggle", default: false },
    ],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerateBlogArticle = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`${API}/blog/generate`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });
      if (res.ok) {
        alert("Sucesso! Um novo artigo foi gerado e salvo. Acesse a listagem do blog para visualizar o novo conteúdo gerado via IA Gemini!");
      } else {
        setError("Erro ao gerar artigo por IA");
      }
    } catch {
      setError("Erro de rede ao conectar com a API");
    } finally {
      setGenerating(false);
    }
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, unknown> = {};
        const items: SettingItem[] = data.settings ?? data ?? [];
        items.forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const getValue = (key: string, defaultValue: unknown) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    try {
      const entries = Object.entries(settings).map(([key, value]) => ({ key, value }));
      const res = await fetch(`${API}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings: entries }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Erro ao salvar configurações");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configurações globais da plataforma</p>
        </div>
        <div className="flex gap-2 items-center">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" /> Salvo!
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
          )}
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleGenerateBlogArticle}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-pink-650 hover:bg-pink-750 text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Gerando Artigo..." : "Gerar Artigo por IA"}
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Tudo"}
          </button>
        </div>
      </div>

      {/* Setting Groups */}
      {SETTING_GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{group.title}</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {group.keys.map((setting) => {
                const currentValue = getValue(setting.key, setting.default);

                return (
                  <div key={setting.key} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{setting.key}</p>
                    </div>

                    {setting.type === "toggle" && (
                      <button
                        onClick={() => updateSetting(setting.key, !currentValue)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          currentValue ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-600"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          currentValue ? "translate-x-5" : ""
                        }`} />
                      </button>
                    )}

                    {setting.type === "text" && (
                      <input
                        type="text"
                        value={String(currentValue ?? "")}
                        onChange={(e) => updateSetting(setting.key, e.target.value)}
                        className="w-64 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    )}

                    {setting.type === "number" && (
                      <input
                        type="number"
                        value={Number(currentValue ?? 0)}
                        onChange={(e) => updateSetting(setting.key, Number(e.target.value))}
                        className="w-32 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 text-right"
                      />
                    )}

                    {setting.type === "color" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={String(currentValue ?? "#000000")}
                          onChange={(e) => updateSetting(setting.key, e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <span className="text-xs font-mono text-gray-500">{String(currentValue)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
