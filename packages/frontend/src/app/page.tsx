'use client';
import React, { useState } from 'react';
import Hero from '../../components/Hero';
import FeaturedProfiles from '../../components/FeaturedProfiles';
import HowItWorks from '../../components/HowItWorks';
import AuthModal from '../../components/AuthModal';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Hero onCtaClick={() => setIsAuthModalOpen(true)} />
      <FeaturedProfiles sectionTitle="Perfis em Destaque" profiles={[]} onProfileClick={() => setIsAuthModalOpen(true)} />
      <HowItWorks />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode="register" 
          onRegistrationComplete={() => setIsAuthModalOpen(false)}
          onLoginSuccess={() => {
            setIsAuthModalOpen(false);
            router.push('/feed');
          }}
          navigateTo={() => {}}
        />
      )}
    </>
  );
}
