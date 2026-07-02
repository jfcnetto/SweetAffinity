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

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'home' | 'feed' | 'matches'>('home');
  
  const { isAuthenticated, logout } = useAuth();

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
    </div>
  );
}
