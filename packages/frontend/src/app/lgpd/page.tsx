'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Shield, Download, Trash2, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LgpdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const getToken = () => localStorage.getItem('accessToken') ?? '';

  const handleExport = async () => {
    setLoading('export');
    try {
      const { data } = await axios.get(`${API_URL}/lgpd/export`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      // Download como JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sweetaffinity-meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar seus dados. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.toLowerCase() !== 'deletar minha conta') {
      alert('Digite exatamente: deletar minha conta');
      return;
    }

    setLoading('delete');
    try {
      await axios.delete(`${API_URL}/lgpd/delete-account`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      localStorage.clear();
      alert('Sua conta foi excluída permanentemente. Obrigado por usar o Sweet Affinity.');
      router.replace('/');
    } catch {
      alert('Erro ao excluir conta. Entre em contato com suporte@sweetaffinity.com');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-100 rounded-xl">
            <Shield className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacidade & LGPD</h1>
            <p className="text-gray-500 text-sm">Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados</p>
          </div>
        </div>

        {/* Exportar Dados */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-800">Exportar Meus Dados</h2>
              <p className="text-gray-500 text-sm mt-1">
                Baixe uma cópia de todos os seus dados armazenados na plataforma, incluindo perfil,
                fotos, mensagens e histórico de assinaturas. Formato JSON.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={loading === 'export'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading === 'export' ? 'Exportando...' : 'Exportar Meus Dados'}
          </button>
        </div>

        {/* Excluir Conta */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-red-100">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-red-700">Excluir Minha Conta</h2>
              <p className="text-gray-500 text-sm mt-1">
                Esta ação é <strong>irreversível</strong>. Todos os seus dados, fotos, mensagens
                e histórico de assinaturas serão permanentemente excluídos.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 text-sm">
              Se você possui uma assinatura ativa, ela será cancelada imediatamente. Não haverá reembolso proporcional.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">
              Para confirmar, digite: <span className="font-bold text-red-600">deletar minha conta</span>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="deletar minha conta"
              className="w-full border border-red-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={loading === 'delete' || deleteConfirm.toLowerCase() !== 'deletar minha conta'}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-40"
          >
            {loading === 'delete' ? 'Excluindo...' : 'Excluir Permanentemente'}
          </button>
        </div>

        {/* DPO Contact */}
        <div className="bg-gray-100 rounded-2xl p-5 text-center">
          <p className="text-gray-600 text-sm">
            Dúvidas sobre privacidade? Entre em contato com nosso DPO:<br />
            <a href="mailto:privacidade@sweetaffinity.com" className="text-pink-600 font-medium hover:underline">
              privacidade@sweetaffinity.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
