'use client';
import SubscriptionPlans from '../../components/SubscriptionPlans';
import PaymentModal from '../../components/PaymentModal';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Plan } from '../../types';



export default function PlansRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [prices, setPrices] = useState({ premium: 9900, diamante: 14900 });
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    // Carrega preços dinâmicos do backend configurados no painel admin
    const fetchPrices = async () => {
      try {
        const response = await api.get('/api/payment/prices');
        setPrices(response.data);
      } catch (err) {
        console.error("Erro ao carregar preços das configurações do site", err);
      } finally {
        setApiLoading(false);
      }
    };
    fetchPrices();
  }, []);

  if (isLoading || apiLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink"></div>
      </div>
    );
  }

  // Formata os centavos obtidos do banco para reais legíveis
  const formatPrice = (cents: number) => {
    const value = cents / 100;
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`;
  };

  const dynamicPlans: Plan[] = [
    { name: 'Gratuito', price: 'R$ 0,00', features: ['Criar perfil básico', 'Ver 10 perfis por dia', '1 Match por dia'], highlight: false },
    { name: 'Premium (VIP)', price: formatPrice(prices.premium), features: ['Perfis ilimitados', 'Chat e Match ilimitados', 'Sem anúncios', 'Selo VIP'], highlight: true },
    { name: 'Premium+ (Diamante)', price: formatPrice(prices.diamante), features: ['Tudo do VIP', 'Ver quem curtiu você', 'Destaque nas buscas'], highlight: false }
  ];

  const handleSubscribe = (plan: Plan) => {
    if (!isAuthenticated) {
      // Se não autenticado, redireciona/ativa o modal de registro via parâmetro de busca
      router.push('/plans?auth=register');
    } else {
      setSelectedPlan(plan);
    }
  };

  return (
    <>
      <SubscriptionPlans plans={dynamicPlans} onSubscribeClick={handleSubscribe} />
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onPaymentSuccess={() => {
            setSelectedPlan(null);
            router.push('/feed');
          }}
        />
      )}
    </>
  );
}
