
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
  const [favoritedProfiles, setFavoritedProfiles] = useState<number[]>(() => {
    try {
        const saved = localStorage.getItem('favoritedProfiles');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to parse favorites from localStorage", error);
        return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('favoritedProfiles', JSON.stringify(favoritedProfiles));
  }, [favoritedProfiles]);

  const handleToggleFavorite = (profileId: number) => {
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
        return profilesCopy.sort((a, b) => b.popularity - a.popularity);
      case 'novos':
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return profilesCopy.filter(p => new Date(p.registeredDate) > oneDayAgo);
      case 'proximos':
        return profilesCopy.sort((a, b) => a.distance - b.distance);
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
        <h2 className="text-4xl font-bold text-center mb-4 font-display text-gray-800">{sectionTitle}</h2>
        <div className="flex justify-center space-x-2 md:space-x-4 mb-12 flex-wrap">
          <TabButton tabName="destaques" label="Destaques" />
          <TabButton tabName="novos" label="Novos" />
          <TabButton tabName="proximos" label="Próximos a você" />
          <TabButton tabName="favoritos" label="Favoritos" />
        </div>
        
        {displayedProfiles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayedProfiles.map(profile => (
              <div key={profile.id} className="relative">
                <button onClick={() => onProfileClick(profile)} className="w-full text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink transition-all duration-300">
                    <ProfileCard 
                        profile={profile} 
                        isFavorited={favoritedProfiles.includes(profile.id)}
                        onToggleFavorite={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(profile.id);
                        }}
                    />
                </button>
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
