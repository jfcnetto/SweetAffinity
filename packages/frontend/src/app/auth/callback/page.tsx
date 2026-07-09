'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Página de callback do Google OAuth
 * O @fastify/oauth2 redireciona para /auth/google/callback no backend.
 * Esta rota (/auth/callback) é usada quando o frontend gerencia o redirect.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');

      if (token) {
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        const pendingType = localStorage.getItem('pendingProfileType');
        if (pendingType) {
            try {
                // Ensure api uses the new token explicitly in case the interceptor isn't ready
                const { api } = await import('../../../services/api');
                await api.post('/profiles', { relationshipType: pendingType }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch(e) {
                console.error('Failed to update profile type', e);
            }
            localStorage.removeItem('pendingProfileType');
        }

        refreshUser?.();
        router.replace('/feed');
      } else {
        router.replace('/?error=oauth_failed');
      }
    };
    
    processCallback();
  }, [router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Autenticando com Google...</p>
      </div>
    </div>
  );
}
