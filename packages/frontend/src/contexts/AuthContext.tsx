"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';
import { PinLockOverlay } from '../components/PinLockOverlay';

interface UserData {
  id?: string;
  sub?: string;
  email?: string;
  relationshipType?: 'baby' | 'daddy' | 'mommy';
  isPremium?: boolean;
  profileType?: string;
  hasPhotos?: boolean;
  primaryPhotoUrl?: string | null;
}

interface AuthContextData {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  discretionMode: boolean;
  toggleDiscretionMode: () => void;
  isLocked: boolean;
  unlockApp: () => void;
  savedPin: string;
  setAppPin: (newPin: string) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [discretionMode, setDiscretionMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [savedPin, setSavedPin] = useState('1234'); // PIN padrão de teste

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (err) {
      console.error("Erro ao obter dados do usuário atual", err);
      // We don't call logout here to avoid circular dependency, we just clear the tokens
      localStorage.removeItem('sweet_access_token');
      localStorage.removeItem('sweet_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mode = localStorage.getItem('discretion_mode') === 'true';
      setDiscretionMode(mode);
      
      const pin = localStorage.getItem('discretion_pin') || '1234';
      setSavedPin(pin);

      const lockedState = localStorage.getItem('discretion_locked') === 'true';
      if (mode && lockedState) {
        setIsLocked(true);
      }
    }
  }, []);

  // Monitora inatividade de 5 minutos para bloquear com PIN
  useEffect(() => {
    if (!discretionMode || !user) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        localStorage.setItem('discretion_locked', 'true');
      }, 5 * 60 * 1000); // 5 minutos
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [discretionMode, user]);

  // Modifica título da aba discretamente
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (discretionMode) {
        document.title = 'Meu Blog de Receitas';
      } else {
        document.title = 'Sweet Affinity';
      }
    }
  }, [discretionMode]);

  useEffect(() => {
    // 1. Checa se o Google OAuth injetou tokens na URL via query params
    const params = new URLSearchParams(window.location.search);
    const urlAccessToken = params.get('access_token');
    const urlRefreshToken = params.get('refresh_token');

    if (urlAccessToken && urlRefreshToken) {
      // Limpa os tokens da URL e loga o usuário
      login(urlAccessToken, urlRefreshToken);
      
      // Redireciona o usuário para a área interna (Matches)
      window.location.href = '/matches';
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

  const login = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('sweet_access_token', accessToken);
    localStorage.setItem('sweet_refresh_token', refreshToken);
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('sweet_access_token');
    localStorage.removeItem('sweet_refresh_token');
    localStorage.removeItem('discretion_locked');
    setUser(null);
    window.location.href = '/';
  }, []);

  const toggleDiscretionMode = useCallback(() => {
    const nextMode = !discretionMode;
    setDiscretionMode(nextMode);
    localStorage.setItem('discretion_mode', String(nextMode));
    if (!nextMode) {
      setIsLocked(false);
      localStorage.removeItem('discretion_locked');
    }
  }, [discretionMode]);

  const setAppPin = useCallback((newPin: string) => {
    setSavedPin(newPin);
    localStorage.setItem('discretion_pin', newPin);
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    localStorage.setItem('discretion_locked', 'false');
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout, 
        refreshUser: fetchCurrentUser,
        discretionMode,
        toggleDiscretionMode,
        isLocked,
        unlockApp,
        savedPin,
        setAppPin
      }}
    >
      {isLocked && !!user ? (
        <PinLockOverlay onUnlock={unlockApp} savedPin={savedPin} />
      ) : (
        children
      )}
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
