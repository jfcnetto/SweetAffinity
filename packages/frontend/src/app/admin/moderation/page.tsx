'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { Badge } from '../../../design-system/components/Badge';
import { toast } from '../../../design-system/components/Toast';
import { Shield, Check, X, AlertCircle } from 'lucide-react';

interface PendingProfile {
  id: string;
  displayName: string;
  birthDate: string;
  gender: string;
  relationshipType: string;
  state: string;
  city: string;
  bio: string;
  createdAt: string;
}

export default function ModerationQueuePage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/moderation/pending');
      setProfiles(response.data);
    } catch (err: any) {
      toast.error('Erro ao carregar a fila de moderação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/moderation/${id}/approve`);
      toast.success('Perfil aprovado com sucesso!');
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao aprovar perfil.';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição.');
      return;
    }

    setActionLoading(rejectId);
    try {
      await api.post(`/admin/moderation/${rejectId}/reject`, { reason: rejectReason });
      toast.success('Perfil rejeitado com sucesso.');
      setProfiles(prev => prev.filter(p => p.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao rejeitar perfil.';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-gradient-pink" />
            Fila de Moderação Manual
          </h1>
          <p className="text-slate-500 text-sm mt-1">Revise perfis de usuários cadastrados antes de torná-los públicos.</p>
        </div>
        <Badge variant={profiles.length > 0 ? 'warning' : 'success'}>
          {profiles.length} Pendentes
        </Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink"></div>
        </div>
      ) : profiles.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-slate-200">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Tudo em ordem!</h3>
          <p className="text-slate-500 text-sm mt-1">Nenhum perfil aguardando moderação no momento.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow border-slate-100">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-950">{profile.displayName}</h3>
                    <Badge variant="secondary" className="capitalize">
                      {profile.relationshipType === 'baby' ? 'Sugar Baby' : profile.relationshipType === 'daddy' ? 'Sugar Daddy' : 'Sugar Mommy'}
                    </Badge>
                    <span className="text-slate-400 text-xs">
                      Cadastrado em: {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-650 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <span className="text-slate-400 font-medium block">Gênero</span>
                      <span className="font-bold capitalize">{profile.gender === 'female' ? 'Feminino' : profile.gender === 'male' ? 'Masculino' : 'Outro'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Localização</span>
                      <span className="font-bold">{profile.city} - {profile.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Idade</span>
                      <span className="font-bold">
                        {new Date().getFullYear() - new Date(profile.birthDate).getFullYear()} anos
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sobre mim</span>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-3 md:w-48 self-center">
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(profile.id)}
                    isLoading={actionLoading === profile.id}
                    className="w-full"
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectId(profile.id)}
                    className="w-full text-red-650 border-red-200 hover:bg-red-50/50"
                  >
                    <X className="w-4 h-4 mr-2" /> Rejeitar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Rejeição */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in border border-slate-100">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Rejeitar Perfil</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Descreva brevemente o motivo da rejeição. O usuário receberá uma notificação por e-mail com essa explicação.
            </p>
            <textarea
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[120px] mb-6"
              placeholder="Ex: Foto de perfil imprópria, biografia incompleta, etc..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(''); }}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleRejectSubmit} className="bg-red-600 hover:bg-red-700">
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
