'use client';
import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import FeaturedProfiles from '../components/FeaturedProfiles';
import HowItWorks from '../components/HowItWorks';
import SocialProof from '../components/SocialProof';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('sweet_access_token');
        if (token && isAuthenticated) {
          const response = await api.get('/profiles');
          // Mapeia os dados do backend para bater com o tipo Profile do frontend
          const mapped = response.data.map((p: any) => ({
            id: p.id,
            display_name: p.displayName,
            gender: p.gender,
            city: p.city,
            state: p.state,
            relationship_type: p.relationshipType,
            popularity_score: p.popularityScore || 0,
            primary_photo_url: p.primaryPhotoUrl || null,
            updated_at: p.createdAt || new Date().toISOString(),
          }));
          setProfiles(mapped);
        } else {
          // Perfis mocks exibidos apenas para visitantes deslogados
          setProfiles([
            { id: '1', display_name: 'Clara', relationship_type: 'Baby', city: 'São Paulo', state: 'SP', popularity_score: 95, primary_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', updated_at: new Date().toISOString() },
            { id: '2', display_name: 'Marcelo', relationship_type: 'Daddy', city: 'Rio de Janeiro', state: 'RJ', popularity_score: 90, primary_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop', updated_at: new Date().toISOString() },
            { id: '3', display_name: 'Sofia', relationship_type: 'Baby', city: 'Belo Horizonte', state: 'MG', popularity_score: 85, primary_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop', updated_at: new Date().toISOString() },
          ]);
        }
      } catch (error) {
        console.error("Erro ao buscar perfis na Home:", error);
      }
    };

    fetchProfiles();
  }, [isAuthenticated]);

  const handleProfileClick = (profile: any) => {
    if (isAuthenticated) {
      router.push(`/profiles/${profile.id}`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <Hero onCtaClick={() => setIsAuthModalOpen(true)} />
      <FeaturedProfiles 
        sectionTitle="Conexões para Você" 
        profiles={profiles} 
        onProfileClick={handleProfileClick} 
      />
      <HowItWorks />
      <SocialProof />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode="register" 
          onRegistrationComplete={() => setIsAuthModalOpen(false)}
          onLoginSuccess={() => {
            setIsAuthModalOpen(false);
            router.push('/');
          }}
          navigateTo={() => {}}
        />
      )}
    </>
  );
}
