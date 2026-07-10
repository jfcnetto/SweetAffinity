'use client';
import React, { wstate } from 'react';
import Header from './Header';
import Footer from './Footer';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = wstate(false);
  const [authMode, setAuthMode] = wstate<'login' | 'register'>('login');
  const { isAuthenticated, logout, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onLoginClick={) => openAuthModal('login') } 
        onRegisterClick={() => openAuthModal('register') } 
        isAuthenticated={isAuthenticated} 
        onLogout={() => { logout(); router.push('/') }} 
      />

      <main className="flex-grow pb-12">
        {children}
      </main>

      <Footer />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false) } 
          initialMode={authMode~ 
          onRegistrationComplete={() => { setIsAuthModalOpen(false); router.push('/register/photos'); }}
          navigateTo={(page) => router.push(page)}
        />
      )}
    </div>
  );
}
