'use client';
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated, logout, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Escuta parâmetros de busca para abrir modal de login/registro de qualquer página
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authAction = params.get('auth');
    if (authAction === 'login' || authAction === 'register') {
      setAuthMode(authAction);
      setIsAuthModalOpen(true);
      
      // Limpa os parâmetros da URL sem recarregar
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]auth=[^&]+/, '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [pathname]); // Executa sempre que a rota mudar

  // Redireciona usuários logados com pendências no cadastro (Primeiro Fotos, depois Perfil)
  React.useEffect(() => {
    const isPublicPage = ['/about', '/faq', '/terms', '/privacy', '/security', '/plans'].includes(pathname);
    
    if (!isLoading && isAuthenticated && user && !isPublicPage && pathname !== '/admin') {
      if (user.hasPhotos === false) {
        if (pathname !== '/register/photos') {
          router.push('/register/photos');
        }
      } else if (user.hasCompletedProfile === false) {
        if (pathname !== '/register/profile') {
          router.push('/register/profile');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Menu sub-nav apenas para logados e não no admin?
  const showSubNav = isAuthenticated && pathname !== '/admin';

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onLoginClick={() => openAuthModal('login')} 
        onRegisterClick={() => openAuthModal('register')} 
        isAuthenticated={isAuthenticated} 
        onLogout={handleLogout} 
      />
      
      {showSubNav && (
         <div className="bg-white border-b border-gray-200 py-3 shadow-sm flex justify-center gap-6">
           <button 
             onClick={() => router.push('/matches')} 
             className={`font-semibold ${pathname === '/matches' ? 'text-gradient-pink border-b-2 border-gradient-pink pb-1' : 'text-gray-500 hover:text-gray-700'}`}
           >
             💕 Matches
           </button>
           <button 
             onClick={() => router.push('/plans')} 
             className={`font-semibold flex items-center gap-1 ${pathname === '/plans' ? 'text-gradient-pink border-b-2 border-gradient-pink pb-1' : 'text-gray-500 hover:text-gray-700'}`}
           >
             ✨ Premium {user?.isPremium && <span className="bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full ml-1">ATIVO</span>}
           </button>
           {user?.profileType === 'admin' && (
             <button 
               onClick={() => router.push('/admin')} 
               className={`font-semibold flex items-center gap-1 ${pathname === '/admin' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-gray-700'}`}
             >
               🛡️ Backoffice
             </button>
           )}
           <button 
             onClick={() => router.push('/blog')} 
             className={`font-semibold ${pathname.startsWith('/blog') ? 'text-gradient-pink border-b-2 border-gradient-pink pb-1' : 'text-gray-500 hover:text-gray-700'}`}
           >
             📖 Blog
           </button>
        </div>
      )}

      <main className="flex-grow pb-12">
        {children}
      </main>

      <Footer />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authMode} 
          onRegistrationComplete={() => {
            setIsAuthModalOpen(false);
            router.push('/register/photos');
          }}
          onLoginSuccess={(loggedUser) => {
            setIsAuthModalOpen(false);
            if (loggedUser?.profileType === 'admin') {
              router.push('/admin');
            } else if (!loggedUser?.hasPhotos) {
              router.push('/register/photos');
            } else {
              router.push('/');
            }
          }}
          navigateTo={(page) => router.push(page)}
        />
      )}
    </div>
  );
}
