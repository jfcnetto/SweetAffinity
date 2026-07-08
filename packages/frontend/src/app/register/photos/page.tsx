'use client';
import React from 'react';
import PhotoUpload from '../../../components/PhotoUpload';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect } from 'react';

export default function RegisterPhotosPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink"></div>
      </div>
    );
  }

  return (
    <PhotoUpload 
      onComplete={async () => {
        await refreshUser();
        router.push('/feed');
      }} 
    />
  );
}
