import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api.js';

interface UserData {
  sub: string;
  relationshipType: 'baby' | 'daddy' | 'mommy';
  isPremium: boolean;
  profileType?: string;
  exp: number;
}

interface AuthContextData {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Checa se o Google OAuth injetou tokens na URL via query params
    const params = new URLSearchParams(window.location.search);
    const urlAccessToken = params.get('access_token');
    const urlRefreshToken = params.get('refresh_token');

    if (urlAccessToken && urlRefreshToken) {
      // Limpa a URL do navegador para não exibir o token
      window.history.replaceState({}, document.title, window.location.pathname);
      login(urlAccessToken, urlRefreshToken);
      setIsLoading(false);
      return;
    }

    // 2. Fluxo normal (pega do localStorage)
    const token = localStorage.getItem('sweet_access_token');
    
    if (token) {
      try {
        const decoded = jwtDecode<UserData>(token);
        // Verifica expiração simples (embora o interceptor cuide do refresh nas chamadas)
        if (decoded.exp * 1000 < Date.now()) {
          // Token expirado, vai depender do refresh token disparar na próxima req
        }
        setUser(decoded);
      } catch (err) {
        console.error("Token inválido", err);
        logout();
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('sweet_access_token', accessToken);
    localStorage.setItem('sweet_refresh_token', refreshToken);
    const decoded = jwtDecode<UserData>(accessToken);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem('sweet_access_token');
    localStorage.removeItem('sweet_refresh_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
