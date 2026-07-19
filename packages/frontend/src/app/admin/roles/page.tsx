"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Users,
  Crown,
  Star,
  UserCheck,
  Eye,
  Check,
  X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  created_at: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  "users.view": "Visualizar Usuários",
  "users.edit": "Editar Usuários",
  "users.ban": "Banir Usuários",
  "users.delete": "Excluir Usuários",
  "finance.view": "Ver Financeiro",
  "finance.refund": "Executar Estornos",
  "finance.export": "Exportar Relatórios",
  "ai.view": "Ver Uso de IA",
  "ai.budget": "Gerenciar Orçamento IA",
  "roles.view": "Ver Roles",
  "roles.manage": "Gerenciar Roles",
  "communications.send": "Enviar Comunicações",
  "settings.view": "Ver Configurações",
  "settings.edit": "Editar Configurações",
  "reports.view": "Ver Denúncias",
  "reports.resolve": "Resolver Denúncias",
  "photos.moderate": "Moderar Fotos",
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPermissions, setFormPermissions] = useState<Record<string, boolean>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("sweet_access_token") || "" : "";

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/access/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles ?? data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openCreate = () => {
    setFormName("");
    setFormDesc("");
    setFormPermissions({});
    setEditingRole(null);
    setShowCreateModal(true);
  };

  const openEdit = (role: Role) => {
    setFormName(role.name);
    setFormDesc(role.description || "");
    setFormPermissions({ ...role.permissions });
    setEditingRole(role);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const body = { name: formName, description: formDesc, permissions: formPermissions };
      const url = editingRole
        ? `${API}/admin/access/roles/${editingRole.id}`
        : `${API}/admin/access/roles`;
      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta role?")) return;
    try {
      await fetch(`${API}/admin/access/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRoles();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (key: string) => {
    setFormPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Permission categories
  const permCategories = [
    { name: "Usuários", keys: ["users.view", "users.edit", "users.ban", "users.delete"] },
    { name: "Financeiro", keys: ["finance.view", "finance.refund", "finance.export"] },
    { name: "Inteligência Artificial", keys: ["ai.view", "ai.budget"] },
    { name: "Comunicações", keys: ["communications.send"] },
    { name: "Roles & Acessos", keys: ["roles.view", "roles.manage"] },
    { name: "Configurações", keys: ["settings.view", "settings.edit"] },
    { name: "Moderação", keys: ["reports.view", "reports.resolve", "photos.moderate"] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acessos & Roles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de permissões RBAC do painel administrativo</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Role
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma role criada ainda.</p>
          <button onClick={openCreate} className="mt-4 text-purple-600 hover:underline text-sm font-medium">
            Criar primeira role
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const enabledPerms = Object.entries(role.permissions).filter(([, v]) => v).length;
            const totalPerms = Object.keys(PERMISSION_LABELS).length;

            return (
              <div key={role.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      {role.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{role.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Permissões ativas</span>
                    <span>{enabledPerms}/{totalPerms}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(enabledPerms / totalPerms) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Object.entries(role.permissions)
                    .filter(([, v]) => v)
                    .slice(0, 4)
                    .map(([key]) => (
                      <span key={key} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {PERMISSION_LABELS[key] || key}
                      </span>
                    ))}
                  {enabledPerms > 4 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      +{enabledPerms - 4} mais
                    </span>
                  )}
                </div>

                <p className="mt-4 text-[10px] text-gray-400">
                  Criada em {new Date(role.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingRole ? "Editar Role" : "Criar Nova Role"}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da Role</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Moderador, Financeiro, Suporte"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Breve descrição desta role..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissões</label>
                <div className="space-y-4">
                  {permCategories.map((cat) => (
                    <div key={cat.name}>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{cat.name}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.keys.map((key) => (
                          <button
                            key={key}
                            onClick={() => togglePermission(key)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                              formPermissions[key]
                                ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300"
                                : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center ${
                              formPermissions[key]
                                ? "bg-purple-600 text-white"
                                : "border border-gray-300 dark:border-gray-500"
                            }`}>
                              {formPermissions[key] && <Check className="w-3 h-3" />}
                            </div>
                            {PERMISSION_LABELS[key] || key}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="px-6 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingRole ? "Salvar Alterações" : "Criar Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
