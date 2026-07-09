'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { toast } from '../../../design-system/components/Toast';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function PremiumSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        if (sessionId) {
          await api.post('/checkout/confirm', { sessionId });
          await refreshUser();
          toast.success('Assinatura ativada com sucesso!');
        }
      } catch (err) {
        console.error('Erro ao confirmar pagamento:', err);
        toast.error('Erro ao atualizar status da assinatura.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-none bg-white dark:bg-slate-900 animate-fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Ativando seus benefícios...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-full text-emerald-500 animate-bounce">
                <CheckCircle2 className="w-16 h-16" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Assinatura Ativada! 🎉
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Seja muito bem-vindo ao clube do **Sweet Affinity Premium**. Seu status foi atualizado!
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 text-left">
              <ShieldCheck className="w-8 h-8 text-pink-500 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Acesso Total Desbloqueado</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Mensagens ilimitadas, selo premium, destaque nas buscas e muito mais.</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/feed')}
              className="w-full bg-gradient-to-r from-gradient-pink to-gradient-orange border-none text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md"
            >
              Começar a usar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
