'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function PremiumCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-none bg-white dark:bg-slate-900 animate-fade-in">
        <div className="flex justify-center">
          <div className="bg-amber-50 dark:bg-amber-955/20 p-4 rounded-full text-amber-500">
            <AlertCircle className="w-16 h-16" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Assinatura Cancelada
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            O processo de checkout do Stripe foi interrompido e nenhuma cobrança foi realizada.
          </p>
        </div>

        <Button
          onClick={() => router.push('/plans')}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para os planos
        </Button>
      </Card>
    </div>
  );
}
