import React, { useEffect, useState } from 'react';
import { MatchService, FeedProfile } from '../services/match.service.js';
import toast from 'react-hot-toast';
import { Heart, X } from 'lucide-react';

export default function FeedPage() {
  const [profiles, setProfiles] = useState<FeedProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const data = await MatchService.getFeed();
      setProfiles(data);
      setCurrentIndex(0);
    } catch (error) {
      toast.error('Erro ao carregar o feed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length) return;
    
    const profile = profiles[currentIndex];
    setCurrentIndex(prev => prev + 1);

    try {
      const response = await MatchService.swipe(profile.id, action);
      if (response.match) {
        toast.success(`Você deu Match com ${profile.displayName}! 🎉`, { duration: 5000 });
      } else if (action === 'like') {
        toast.success('Like enviado!');
      }
    } catch (error) {
      toast.error('Erro ao registrar swipe.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Buscando perfis compatíveis...</p></div>;
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-2xl font-display text-gray-800 mb-4">Você viu todos por hoje!</h3>
        <button onClick={loadFeed} className="px-6 py-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-full font-semibold">
          Atualizar Feed
        </button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-md mx-auto relative bg-white rounded-2xl shadow-xl overflow-hidden mt-10 border border-gray-100">
      <div className="h-96 bg-gray-200 relative">
        {/* Placeholder para a foto principal, assumindo que existiria uma URL ou mock no futuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
          <h2 className="text-3xl font-bold text-white font-display flex items-baseline gap-2">
            {currentProfile.displayName}
            <span className="text-sm font-normal opacity-80 capitalize">
               ({currentProfile.relationshipType})
            </span>
          </h2>
          <p className="text-white/90 text-sm mt-1">
            {currentProfile.city && currentProfile.state ? `${currentProfile.city}, ${currentProfile.state}` : 'Localização não informada'}
          </p>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-700 italic">"{currentProfile.bio || 'Sem bio disponível'}"</p>
        
        <div className="flex justify-center gap-6 mt-8">
          <button 
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 bg-white border-2 border-red-200 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-400 hover:scale-105 transition-all shadow-md"
          >
            <X size={32} />
          </button>
          
          <button 
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all shadow-md"
          >
            <Heart size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}
