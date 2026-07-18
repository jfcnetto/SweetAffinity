"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Plus, Edit, Trash2, Search, X, Loader2 } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  source: "ai_auto" | "ai_manual" | "manual";
  publishedAt: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    metaDescription: "",
    content: "",
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/blog`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleGenerateBlog = async () => {
    setGenerating(true);
    const token = localStorage.getItem("sweet_access_token") || "";
    try {
      const res = await fetch(`${API}/blog/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.warn("[SweetCRM] Log da geração do blog:", data.message);
        if (data.fallback) {
          prompt("Geração concluída com Fallback Local (Copie o erro abaixo):", data.message);
        } else {
          alert(data.message);
        }
        fetchPosts();
      } else {
        alert("Erro ao executar geração de artigo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao gerar o artigo.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
    const token = localStorage.getItem("sweet_access_token") || "";
    try {
      const res = await fetch(`${API}/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Erro ao excluir artigo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("sweet_access_token") || "";
    const method = editingPost ? "PUT" : "POST";
    const url = editingPost ? `${API}/blog/${editingPost.id}` : `${API}/blog`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPosts();
      } else {
        alert("Erro ao salvar artigo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    }
  };

  const openModalForCreate = () => {
    setEditingPost(null);
    setFormData({ title: "", slug: "", metaDescription: "", content: "" });
    setIsModalOpen(true);
  };

  const openModalForEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      metaDescription: post.metaDescription,
      content: post.content,
    });
    setIsModalOpen(true);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "ai_auto":
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">🤖 IA Auto</span>;
      case "ai_manual":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">⚡ IA Manual</span>;
      case "manual":
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">✍️ Manual</span>;
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento do Blog</h1>
          <p className="text-gray-500 text-sm mt-1">Crie, edite e gerencie todos os artigos do SweetAffinity.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={openModalForCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" />
            Novo Artigo Manual
          </button>
          <button
            onClick={handleGenerateBlog}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-lg hover:opacity-90 transition font-bold text-sm shadow-md disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Gerando..." : "Gerar Artigo por IA"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar artigos por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-200 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4">Título do Artigo</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Data de Publicação</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando artigos...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum artigo encontrado.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md truncate">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      {getSourceBadge(post.source)}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openModalForEdit(post)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                          title="Editar Artigo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                          title="Excluir Artigo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPost ? "Editar Artigo" : "Criar Novo Artigo Manual"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSavePost} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Ex: 5 Destinos na Europa..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Ex: 5-destinos-na-europa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Meta Description (SEO)</label>
                <textarea
                  required
                  rows={2}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                  placeholder="Resumo curto para o Google..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Conteúdo do Artigo</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="Escreva seu artigo aqui..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition"
                >
                  Salvar Artigo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
