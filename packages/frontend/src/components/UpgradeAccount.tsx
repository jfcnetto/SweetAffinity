'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from '../design-system/components/Button';
import { Card } from '../design-system/components/Card';
import { Badge } from '../design-system/components/Badge';
import { toast } from '../design-system/components/Toast';
import { Check, AlertTriangle, RefreshCw } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceCents: number;
  billingPeriod: 'monthly' | 'quarterly' | 'semi_annual';
  features: string[];
  stripePriceId: string;
  isHighlighted: boolean;
  discountPercentage: number;
}

export const UpgradeAccount: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'semi_annual'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/plans?billingPeriod=${billingPeriod}`);
      setPlans(response.data);
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
      setError(true);
      toast.error('Não foi possível carregar os planos de assinatura.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [billingPeriod]);

  const handleSubscribe = async (plan: Plan) => {
    setCheckoutLoading(plan.id);
    try {
      const response = await api.post('/checkout/session', {
        stripePriceId: plan.stripePriceId,
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('URL de checkout inválida.');
      }
    } catch (err: any) {
      console.error('Erro ao iniciar checkout:', err);
      const msg = err.response?.data?.message || 'Erro ao iniciar processo de pagamento.';
      toast.error(msg);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (cents: number) => {
    const value = cents / 100;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly': return 'mês';
      case 'quarterly': return 'trimestre';
      case 'semi_annual': return 'semestre';
      default: return 'período';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent">
          Escolha seu Plano Premium
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Desbloqueie conversas ilimitadas, destaque seu perfil e encontre sua conexão ideal sem barreiras.
        </p>
      </div>

      {/* Period Select Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex space-x-1 border border-gray-200 dark:border-gray-700 shadow-inner">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-950 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('quarterly')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              billingPeriod === 'quarterly'
                ? 'bg-white dark:bg-gray-700 text-gray-950 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
            }`}
          >
            Trimestral
            <span className="bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              -15%
            </span>
          </button>
          <button
            onClick={() => setBillingPeriod('semi_annual')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              billingPeriod === 'semi_annual'
                ? 'bg-white dark:bg-gray-700 text-gray-950 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
            }`}
          >
            Semestral
            <span className="bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              -30%
            </span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-8 border border-gray-200 dark:border-gray-800 animate-pulse space-y-6 flex flex-col justify-between min-h-[480px]">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3"></div>
                <div className="space-y-2 pt-4">
                  {[1, 2, 3, 4].map((f) => (
                    <div key={f} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  ))}
                </div>
              </div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-full mt-6"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Não foi possível obter os planos</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Verifique sua conexão com a internet ou tente novamente mais tarde.
          </p>
          <Button onClick={fetchPlans} className="flex items-center gap-2 mt-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Plans List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-8 relative flex flex-col justify-between transition-all duration-350 min-h-[480px] bg-white dark:bg-slate-900 ${
                plan.isHighlighted
                  ? 'border-2 border-pink-500 dark:border-pink-500 shadow-xl ring-4 ring-pink-500/10 scale-105 z-10'
                  : 'border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
              }`}
            >
              {plan.isHighlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="elite" className="px-4 py-1 text-xs font-bold uppercase shadow-md bg-gradient-to-r from-gradient-pink to-gradient-orange border-none">
                    Mais popular
                  </Badge>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  {plan.discountPercentage > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Economize {plan.discountPercentage}%
                    </span>
                  )}
                </div>

                <div className="flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {formatPrice(plan.priceCents)}
                  </span>
                  <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    /{getPeriodLabel(plan.billingPeriod)}
                  </span>
                </div>

                <ul className="space-y-3.5 border-t border-gray-100 dark:border-gray-800 pt-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                      <Check className="w-4 h-4 text-emerald-500 mr-2.5 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => handleSubscribe(plan)}
                  isLoading={checkoutLoading === plan.id}
                  variant={plan.isHighlighted ? 'primary' : 'secondary'}
                  className={`w-full py-3.5 rounded-xl font-bold transition ${
                    plan.isHighlighted 
                      ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange border-none text-white hover:opacity-90 shadow-md'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Assinar Agora
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formas de Pagamento Footer */}
      <div className="mt-16 border-t border-gray-150 dark:border-gray-800 pt-8 text-center space-y-4">
        <p className="text-xs font-bold text-gray-500 dark:text-white uppercase tracking-wider">
          Formas de Pagamento Aceitas
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 bg-white dark:bg-slate-900 py-4 px-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-fit mx-auto">
          <img src="/images/payment/pix.png" alt="Pix" className="h-8 object-contain hover:scale-105 transition" />
          <img src="/images/payment/visa.png" alt="Visa" className="h-5 object-contain hover:scale-105 transition" />
          <img src="/images/payment/mastercard.png" alt="Mastercard" className="h-8 object-contain hover:scale-105 transition" />
          <img src="/images/payment/elo.png" alt="Elo" className="h-6 object-contain hover:scale-105 transition" />
          <img src="/images/payment/amex.png" alt="Amex" className="h-7 object-contain hover:scale-105 transition" />
        </div>
        <p className="text-[10px] text-gray-455 dark:text-gray-300 flex items-center justify-center gap-1.5 pt-2">
          🔒 Pagamento 100% seguro processado via criptografia SSL do Stripe. Cancelamento simplificado.
        </p>
      </div>
    </div>
  );
};

export default UpgradeAccount;
