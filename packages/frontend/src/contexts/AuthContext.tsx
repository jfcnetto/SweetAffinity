"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

interface UserData {
  id?: string;
  sub?: string;
  email?: string;
  relationshipType?: 'baby' | 'daddy' | 'mommy';
  isPremium?: boolean;
  profileType?: string;
  hasPhotos?: boolean;
}

interface AuthContextData {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (err) {
      console.error("Erro ao obter dados do usuário atual", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Checa se o Google OAuth injetou tokens na URL via query params
    const params = new URLSearchParams(window.location.search);
    const urlAccessToken = params.get('access_token');
    const urlRefreshToken = params.get('refresh_token');

    if (urlAccessToken && urlRefreshToken) {
      // Limpa a URL do navegador para não exibir o token
      window.history.replaceState({}, document.title, window.location.pathname);
      login(urlAccessToken, urlRefreshToken);
      return;
    }

    // 2. Fluxo normal (pega do localStorage)
    const token = localStorage.getItem('sweet_access_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('sweet_access_token', accessToken);
    localStorage.setItem('sweet_refresh_token', refreshToken);
    // Carrega dados frescos imediatamente após login
    fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('sweet_access_token');
    localStorage.removeItem('sweet_refresh_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser: fetchCurrentUser }}>
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
