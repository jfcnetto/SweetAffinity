import React, { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  isAdminView?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onLoginClick, 
  onRegisterClick, 
  isAuthenticated, 
  onLogout, 
  isAdminView = false 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock de notificações. Depois integraremos via API
  const unreadCount = 2;

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href={isAdminView ? "/admin" : "/"} className="text-3xl font-bold text-gray-800 font-display cursor-pointer">
          Sweet Affinity
        </Link>

        <div className="flex items-center space-x-4 relative">
          {isAuthenticated ? (
            <>
              {/* SINO DE NOTIFICAÇÕES */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-600 hover:text-intense-red transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* MODAL DE NOTIFICAÇÕES */}
              {showNotifications && (
                <div className="absolute top-12 right-12 w-80 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">
                    Notificações
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer bg-pink-50">
                      <p className="text-sm font-semibold text-gray-800">💖 Novo Match!</p>
                      <p className="text-xs text-gray-600">Você e Clara curtiram os perfis um do outro.</p>
                      <p className="text-xs text-gray-400 mt-1">Há 5 minutos</p>
                    </div>
                    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-semibold text-gray-800">✨ Bem-vindo!</p>
                      <p className="text-xs text-gray-600">Complete seu perfil para conseguir mais matches.</p>
                      <p className="text-xs text-gray-400 mt-1">Há 2 dias</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onLogout}
                className="bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button onClick={onLoginClick} className="text-gray-600 hover:text-intense-red transition-colors duration-300">Entrar</button>
              <button
                onClick={onRegisterClick}
                className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold px-6 py-2 rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                Cadastre-se
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;