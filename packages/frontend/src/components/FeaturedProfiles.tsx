import React, { useState, useMemo, useEffect } from 'react';
import type { Profile } from '../types';
import ProfileCard from './ProfileCard';

interface FeaturedProfilesProps {
  sectionTitle: string;
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
}

const FeaturedProfiles: React.FC<FeaturedProfilesProps> = ({ sectionTitle, profiles, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState('destaques');
  // Alterado para string[] porque agora usamos UUIDs (strings) do nosso banco local
  const [favoritedProfiles, setFavoritedProfiles] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('favoritedProfiles');
      if (saved) {
        setFavoritedProfiles(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to parse favorites from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (favoritedProfiles.length > 0) {
      localStorage.setItem('favoritedProfiles', JSON.stringify(favoritedProfiles));
    }
  }, [favoritedProfiles]);

  const handleToggleFavorite = (profileId: string) => {
    setFavoritedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const displayedProfiles = useMemo(() => {
    const profilesCopy = [...profiles];
    switch (activeTab) {
      case 'destaques':
        // Atualizado para usar o campo correto: popularity_score
        return profilesCopy.sort((a, b) => b.popularity_score - a.popularity_score);
      case 'novos':
        // Filtra perfis cadastrados nos últimos 7 dias usando a estampa de tempo do nosso Postgres
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return profilesCopy.filter(p => new Date(p.updated_at) > sevenDaysAgo);
      case 'proximos':
        // Ordena por cidade em ordem alfabética local como critério de proximidade em ambiente de desenvolvimento
        return profilesCopy.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
      case 'favoritos':
        return profiles.filter(p => favoritedProfiles.includes(p.id));
      default:
        return profilesCopy;
    }
  }, [activeTab, profiles, favoritedProfiles]);

  const TabButton: React.FC<{ tabName: string; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm md:text-base font-semibold rounded-full transition-colors duration-300 ${activeTab === tabName ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white' : 'text-gray-600 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 md:mb-6 font-display text-gray-800">{sectionTitle}</h2>
        <div className="flex justify-center gap-2 md:gap-4 mb-8 md:mb-12 flex-wrap">
          <TabButton tabName="destaques" label="Destaques" />
          <TabButton tabName="novos" label="Novos" />
          <TabButton tabName="proximos" label="Próximos a você" />
          <TabButton tabName="favoritos" label="Favoritos" />
        </div>
        
        {displayedProfiles.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedProfiles.map(profile => (
              <div key={profile.id} className="relative">
                <div onClick={() => onProfileClick(profile)} className="w-full text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink transition-all duration-300 cursor-pointer">
                    <ProfileCard 
                        profile={profile} 
                        isFavorited={favoritedProfiles.includes(profile.id)}
                        onToggleFavorite={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(profile.id);
                        }}
                    />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-600">{activeTab === 'favoritos' ? 'Você ainda não adicionou nenhum perfil aos favoritos.' : 'Nenhum perfil encontrado para esta categoria.'}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProfiles;