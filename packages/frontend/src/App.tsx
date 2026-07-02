import React, { useState } from 'react';
import Header from './components/Header.js';
import Hero from './components/Hero.js';
import FeaturedProfiles from './components/FeaturedProfiles.js';
import HowItWorks from './components/HowItWorks.js';
import Footer from './components/Footer.js';
import AuthModal from './components/AuthModal.js';
import { useAuth } from './contexts/AuthContext.js';

import FeedPage from './components/FeedPage.js';
import MatchesPage from './components/MatchesPage.js';
import SubscriptionPlans from './components/SubscriptionPlans.js';
import PaymentModal from './components/PaymentModal.js';
import type { Plan } from './types.js';

const mockPlans: Plan[] = [
  { name: 'Gratuito', price: 'R$ 0,00', features: ['Criar perfil básico', 'Ver 10 perfis por dia', '1 Match por dia'], highlight: false },
  { name: 'VIP', price: 'R$ 99,00/mês', features: ['Perfis ilimitados', 'Chat e Match ilimitados', 'Sem anúncios', 'Selo VIP'], highlight: true },
  { name: 'VIP+', price: 'R$ 149,00/mês', features: ['Tudo do VIP', 'Ver quem curtiu você', 'Destaque nas buscas'], highlight: false }
];

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'home' | 'feed' | 'matches' | 'plans'>('home');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  const { isAuthenticated, logout, user } = useAuth();

  // Se estiver logado e na home, joga pro feed
  React.useEffect(() => {
    if (isAuthenticated && currentView === 'home') {
      setCurrentView('feed');
    } else if (!isAuthenticated) {
      setCurrentView('home');
    }
  }, [isAuthenticated, currentView]);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSubscribeClick = (plan: Plan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-gray">
      <Header 
        onLoginClick={() => openAuthModal('login')} 
        onRegisterClick={() => openAuthModal('register')} 
        isAuthenticated={isAuthenticated} 
        onLogout={() => {
          logout();
          setCurrentView('home');
        }} 
      />
      
      {isAuthenticated && (
        <div className="bg-white border-b border-gray-200 py-3 shadow-sm flex justify-center gap-6">
           <button 
             onClick={() => setCurrentView('feed')} 
             className={`font-semibold ${currentView === 'feed' ? 'text-gradient-pink border-b-2 border-gradient-pink pb-1' : 'text-gray-500 hover:text-gray-700'}`}
           >
             🔥 Feed
           </button>
           <button 
             onClick={() => setCurrentView('matches')} 
             className={`font-semibold ${currentView === 'matches' ? 'text-gradient-pink border-b-2 border-gradient-pink pb-1' : 'text-gray-500 hover:text-gray-700'}`}
           >
             💕 Matches
           </button>
           <button 
             onClick={() => setCurrentView('plans')} 
             className={`font-semibold flex items-center gap-1 ${currentView === 'plans' ? 'text-gradient-pink border-b-2 border-gradient-pink pb-1' : 'text-gray-500 hover:text-gray-700'}`}
           >
             ✨ Premium {user?.isPremium && <span className="bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full ml-1">ATIVO</span>}
           </button>
        </div>
      )}

      <main className="flex-grow pb-12">
        {currentView === 'home' && (
          <>
            <Hero onCtaClick={() => openAuthModal('register')} />
            <FeaturedProfiles sectionTitle="Perfis em Destaque" profiles={[]} onProfileClick={() => openAuthModal('register')} />
            <HowItWorks />
          </>
        )}
        
        {currentView === 'feed' && <FeedPage />}
        {currentView === 'matches' && <MatchesPage />}
        {currentView === 'plans' && <SubscriptionPlans plans={mockPlans} onSubscribeClick={handleSubscribeClick} />}
      </main>

      <Footer />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authMode} 
          onRegistrationComplete={() => setIsAuthModalOpen(false)}
          onLoginSuccess={() => setIsAuthModalOpen(false)}
          navigateTo={(page) => console.log('Navigate to:', page)}
        />
      )}

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onPaymentSuccess={() => {
            setSelectedPlan(null);
            setCurrentView('feed');
          }}
        />
      )}
    </div>
  );
}
