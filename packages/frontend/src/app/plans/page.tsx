'use client';
import SubscriptionPlans from '../../components/SubscriptionPlans';
import PaymentModal from '../../components/PaymentModal';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Plan } from '../../types';

const mockPlans: Plan[] = [
  { name: 'Gratuito', price: 'R$ 0,00', features: ['Criar perfil básico', 'Ver 10 perfis por dia', '1 Match por dia'], highlight: false },
  { name: 'VIP', price: 'R$ 99,00/mês', features: ['Perfis ilimitados', 'Chat e Match ilimitados', 'Sem anúncios', 'Selo VIP'], highlight: true },
  { name: 'VIP+', price: 'R$ 149,00/mês', features: ['Tudo do VIP', 'Ver quem curtiu você', 'Destaque nas buscas'], highlight: false }
];

export default function PlansRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <SubscriptionPlans plans={mockPlans} onSubscribeClick={setSelectedPlan} />
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
