import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../design-system/components/Avatar';
import { toast } from '../design-system/components/Toast';
import { Home, Heart, MessageSquare, ShieldAlert, BookOpen, Menu, X } from 'lucide-react';

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, discretionMode, toggleDiscretionMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
          <div className="relative w-9 h-9 flex items-center justify-center bg-gradient-to-tr from-gradient-pink to-gradient-orange rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
            <svg 
              className="w-5 h-5 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Infinity-shaped heart representation */}
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          {/* Logo Text */}
          <span className="text-xl md:text-2xl font-bold tracking-tight hidden sm:block whitespace-nowrap">
            <span className="text-slate-900 font-extrabold">Sweet</span>
            <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent ml-1 font-black">Affinity</span>
          </span>
        </Link>

        {/* Central Navigation Menu */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`flex items-center text-sm font-semibold transition-colors ${
                pathname === '/' ? 'text-pink-650 font-bold' : 'text-gray-600 hover:text-pink-650'
              }`}
            >
              <Home className="w-4.5 h-4.5 mr-1.5" />
              Home
            </Link>
            <Link
              href="/matches"
              className={`flex items-center text-sm font-semibold transition-colors ${
                pathname === '/matches' ? 'text-pink-650 font-bold' : 'text-gray-600 hover:text-pink-650'
              }`}
            >
              <Heart className="w-4.5 h-4.5 mr-1.5" />
              Matches
            </Link>
            <Link
              href="/matches"
              className={`flex items-center text-sm font-semibold transition-colors relative ${
                pathname === '/chat' ? 'text-pink-650 font-bold' : 'text-gray-600 hover:text-pink-650'
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5 mr-1.5" />
              Mensagens
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
              )}
            </Link>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center text-sm font-semibold transition-colors ${
                pathname.startsWith('/blog') ? 'text-pink-650 font-bold' : 'text-gray-600 hover:text-pink-650'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 mr-1.5" />
              Blog
            </a>
          </nav>
        )}

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
                onClick={toggleDiscretionMode}
                title={discretionMode ? "Desativar Modo Discrição" : "Ativar Modo Discrição"}
                className={`p-2 rounded-full transition-colors ${
                  discretionMode
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>

              {!user?.isPremium && (
                <button
                  onClick={() => router.push('/plans')}
                  className="hidden md:inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-1.5 rounded-full text-xs transition-colors shadow-sm whitespace-nowrap ml-2"
                >
                  Seja Premium
                </button>
              )}

              {user && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="focus:outline-none flex items-center"
                    aria-label="User menu"
                  >
                    <Avatar
                      src={user.primaryPhotoUrl || null}
                      alt={user.email || 'User'}
                      size="sm"
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      hasBorderShadow={false}
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-450 truncate flex items-center justify-between gap-1.5">
                        <span className="truncate">{user.email}</span>
                        {user.isPremium && (
                          <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse flex-shrink-0">
                            Elite
                          </span>
                        )}
                      </div>
                      
                      {user.email === 'jfcnetto@gmail.com' && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-650 transition-colors"
                        >
                          Painel Admin
                        </Link>
                      )}
                      
                      <Link
                        href={`/profiles/${user.id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-650 transition-colors"
                      >
                        Ver Perfil
                      </Link>

                      <Link
                        href={`/profiles/${user.id}?edit=true`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-650 transition-colors"
                      >
                        Editar Perfil
                      </Link>
                      
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-650 transition-colors"
                      >
                        Configurações
                      </Link>
                      
                      <Link
                        href="/faq"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-650 transition-colors"
                      >
                        Ajuda
                      </Link>
                      
                      <hr className="my-1 border-gray-100" />
                      
                      <button
                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-650 hover:bg-red-50 transition-colors font-semibold"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
              <a 
                href="/blog" 
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex text-gray-655 hover:text-pink-650 transition-colors duration-300 items-center text-sm font-semibold mr-2"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Blog
              </a>
              <button 
                onClick={onLoginClick}
                className="text-gray-600 hover:text-intense-red transition-colors duration-300 font-semibold px-2 sm:px-4 py-2 rounded-full"
              >
                Entrar
              </button>
              <button 
                onClick={onRegisterClick}
                className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-sm sm:text-base"
              >
                Cadastre-se
              </button>
            </div>
            </>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-pink-600 ml-2"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100 flex flex-col shadow-lg pb-4 absolute w-full">
          {isAuthenticated ? (
            <>
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-6 py-4 text-base font-semibold border-b border-gray-50 ${
                  pathname === '/' ? 'text-pink-650 bg-pink-50/50' : 'text-gray-600'
                }`}
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </Link>
              <Link
                href="/matches"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-6 py-4 text-base font-semibold border-b border-gray-50 ${
                  pathname === '/matches' ? 'text-pink-650 bg-pink-50/50' : 'text-gray-600'
                }`}
              >
                <Heart className="w-5 h-5 mr-3" />
                Matches
              </Link>
              <Link
                href="/chat"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-6 py-4 text-base font-semibold border-b border-gray-50 ${
                  pathname === '/chat' ? 'text-pink-650 bg-pink-50/50' : 'text-gray-600'
                }`}
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Mensagens
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }}
                className="flex items-center px-6 py-4 text-base font-semibold border-b border-gray-50 text-gray-600 w-full text-left text-left"
              >
                Entrar
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onRegisterClick(); }}
                className="flex items-center px-6 py-4 text-base font-semibold border-b border-gray-50 text-pink-650 w-full text-left"
              >
                Cadastre-se
              </button>
            </>
          )}

          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center px-6 py-4 text-base font-semibold border-b border-gray-50 ${
              pathname.startsWith('/blog') ? 'text-pink-650 bg-pink-50/50' : 'text-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5 mr-3" />
            Blog
          </a>

          {isAuthenticated && !user?.isPremium && (
            <div className="px-6 pt-4">
              <button
                onClick={() => { setIsMobileMenuOpen(false); router.push('/plans'); }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
              >
                Seja Premium
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;