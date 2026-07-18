'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { OnboardingWizard } from '../../../components/OnboardingWizard';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, refreshUser, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleComplete = async () => {
    await refreshUser();
    router.push('/'); // Redireciona para a Home
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <OnboardingWizard onComplete={handleComplete} userId={user.id as string} />
      </div>
    </div>
  );
}
