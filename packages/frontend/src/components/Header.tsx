import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  // Busca notificações reais do banco de dados
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications');
      const data = response.data;
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error("Erro ao carregar notificações reais:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Polling leve a cada 30 segundos para manter notificações atualizadas
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id: string, link: string | null) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Atualiza estado local
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }

    setShowNotifications(false);

    if (link) {
      // Se for a notificação de boas-vindas para completar cadastro
      if (link === '/register/photos' && user?.hasPhotos) {
        // Se ele já tem fotos, redireciona para a página de perfil
        router.push(`/profiles/${user.id}`);
      } else {
        router.push(link);
      }
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href={isAdminView ? "/admin" : "/"} className="flex items-center space-x-2.5 group cursor-pointer">
          {/* Logo Icon: Infinity Heart Container */}
          <div className="relative w-9 h-9 flex items-center justify-center bg-gradient-to-tr from-gradient-pink to-gradient-orange rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
            <svg 
              className="w-5.5 h-5.5 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Infinity-shaped heart representation */}
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          {/* Logo Text */}
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-slate-900 font-extrabold">Sweet</span>
            <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent ml-1 font-black">Affinity</span>
          </span>
        </Link>

        <div className="flex items-center space-x-4 relative">
          {isAuthenticated ? (
            <>
              {/* SINO DE NOTIFICAÇÕES */}
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications(); // Atualiza ao abrir
                }}
                className="relative text-gray-600 hover:text-intense-red transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* MODAL DE NOTIFICAÇÕES */}
              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 animate-fade-in">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 text-sm flex justify-between items-center">
                    <span>Notificações</span>
                    {unreadCount > 0 && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">{unreadCount} novas</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id, notif.link)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-pink-50/30' : ''}`}
                        >
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            {notif.type === 'match' ? '💖' : notif.type === 'system' ? '✨' : '✉️'} {notif.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{notif.body}</p>
                          <p className="text-[10px] text-gray-400 mt-2">
                            {new Date(notif.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        Nenhuma notificação por enquanto.
                      </div>
                    )}
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