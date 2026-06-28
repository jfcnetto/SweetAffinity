
import React, { useState, useEffect } from 'react';
import type { Profile } from '../types';
import ProfileCard from './ProfileCard';

interface SearchResultsProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
  onClearSearch: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ profiles, onProfileClick, onClearSearch }) => {
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

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
                    <h2 className="text-4xl font-bold text-center sm:text-left mb-4 sm:mb-0 font-display text-gray-800">Resultados da Busca</h2>
                    <button 
                        onClick={onClearSearch}
                        className="px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 text-gray-600 bg-gray-200 hover:bg-gray-300"
                    >
                        Limpar Busca
                    </button>
                </div>
            
                {profiles.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {profiles.map(profile => (
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
                    <p className="text-gray-600 text-lg">Nenhum perfil encontrado para sua busca.</p>
                    <p className="text-gray-500 mt-2">Tente usar termos diferentes ou verifique a ortografia.</p>
                </div>
                )}
            </div>
        </section>
    );
};

export default SearchResults;
