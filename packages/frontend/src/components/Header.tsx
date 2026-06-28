import React from 'react';
import { NAV_LINKS } from '../constants';

const ADMIN_NAV_LINKS = [
    { name: 'Gerenciar Usuários', pageId: 'admin-users' },
];


interface HeaderProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
  navigateTo: (page: string) => void;
  isLoggedIn: boolean;
  onSignOut: () => void;
  onMessagesClick: () => void;
  isAdminView?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSignInClick, onSignUpClick, navigateTo, isLoggedIn, onSignOut, onMessagesClick, isAdminView = false }) => {
  const handleLogoClick = () => {
    if (isAdminView) {
      navigateTo('admin-users');
    } else {
      navigateTo('home');
    }
  };
  
  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={handleLogoClick} className="text-3xl font-bold text-gray-800 font-display cursor-pointer">
          Sweet Affinity
        </button>
        
        {isAdminView ? (
          <nav className="hidden md:flex space-x-8">
            {ADMIN_NAV_LINKS.map((link) => (
              <button
                key={link.name}
                onClick={() => navigateTo(link.pageId)}
                className="font-semibold text-gray-700 hover:text-intense-red transition-colors duration-300"
              >
                {link.name}
              </button>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.name}
                onClick={() => navigateTo(link.pageId)}
                className="text-gray-600 hover:text-intense-red transition-colors duration-300"
              >
                {link.name}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center space-x-4">
          {isLoggedIn || isAdminView ? (
            <>
              {!isAdminView && (
                 <button
                    onClick={onMessagesClick}
                    className="text-gray-600 hover:text-intense-red transition-colors duration-300 font-semibold"
                  >
                    Mensagens
                  </button>
              )}
              <button
                onClick={onSignOut}
                className="bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button onClick={onSignInClick} className="text-gray-600 hover:text-intense-red transition-colors duration-300">Entrar</button>
              <button
                onClick={onSignUpClick}
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