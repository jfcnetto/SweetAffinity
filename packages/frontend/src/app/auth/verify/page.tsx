'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

import { Suspense } from 'react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMsg('Token de verificação ausente.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify?token=${token}`);
        const data = response.data;

        if (data.success) {
          setStatus('success');
          // Loga o usuário e salva os tokens no localStorage
          login(data.accessToken, data.refreshToken);
          toast.success('E-mail verificado com sucesso!');
          
          // Redireciona para o upload de fotos após 2 segundos
          setTimeout(() => {
            router.push('/register/photos');
          }, 2000);
        }
      } catch (err: any) {
        setStatus('error');
        const msg = err.response?.data?.message || 'Token de verificação inválido ou expirado.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    };

    verifyEmail();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificando seu e-mail</h2>
            <p className="text-gray-500">Por favor, aguarde alguns instantes...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">E-mail verificado! 🎉</h2>
            <p className="text-gray-500 mb-4">Seu cadastro foi confirmado com sucesso.</p>
            <p className="text-sm text-pink-500 font-semibold animate-pulse">Redirecionando para o envio de fotos...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Falha na verificação 😢</h2>
            <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-6">{errorMsg}</p>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-md"
            >
              Ir para a Página Inicial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Carregando...</h2>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
