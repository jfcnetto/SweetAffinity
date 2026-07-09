'use client';

import React from 'react';
import UpgradeAccount from '../../components/UpgradeAccount';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function PlansRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink"></div>
      </div>
    );
  }

  // Se não autenticado, redirecionamos para home para abrir modal
  if (!isAuthenticated) {
    router.push('/?auth=register');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <UpgradeAccount />
    </div>
  );
}
