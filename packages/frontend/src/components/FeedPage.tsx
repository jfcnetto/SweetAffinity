import React, { useEffect, useState } from 'react';
import { MatchService, FeedProfile } from '../services/match.service.js';
import toast from 'react-hot-toast';
import { Heart, X } from 'lucide-react';

export default function FeedPage() {
  const [profiles, setProfiles] = useState<FeedProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ minAge?: number, maxAge?: number, radius?: number, interests?: string }>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFeed(filters);
  }, [filters]);

  const loadFeed = async (currentFilters: any) => {
    try {
      setLoading(true);
      const data = await MatchService.getFeed(currentFilters);
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

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const newFilters: any = {};
    const minAge = fd.get('minAge');
    if (minAge) newFilters.minAge = Number(minAge);
    const maxAge = fd.get('maxAge');
    if (maxAge) newFilters.maxAge = Number(maxAge);
    const radius = fd.get('radius');
    if (radius) newFilters.radius = Number(radius);
    const interests = fd.get('interests');
    if (interests) newFilters.interests = String(interests);
    
    setFilters(newFilters);
    setShowFilters(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Buscando perfis compatíveis...</p></div>;
  }

  const renderFilterModal = () => {
    if (!showFilters) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
            <button onClick={() => setShowFilters(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Filtros de Busca</h3>
            <form onSubmit={applyFilters} className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Idade Mínima</label>
                 <input type="number" name="minAge" defaultValue={filters.minAge} className="w-full border rounded-md p-2" min={18} max={99} />
               </div>
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Idade Máxima</label>
                 <input type="number" name="maxAge" defaultValue={filters.maxAge} className="w-full border rounded-md p-2" min={18} max={99} />
               </div>
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Raio de Distância (Km)</label>
                 <input type="number" name="radius" defaultValue={filters.radius} className="w-full border rounded-md p-2" min={1} max={1000} />
               </div>
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Interesses (separados por vírgula)</label>
                 <input type="text" name="interests" defaultValue={filters.interests} className="w-full border rounded-md p-2" placeholder="Ex: Viagens, Vinhos" />
               </div>
               <button type="submit" className="w-full bg-gradient-to-r from-gradient-pink to-gradient-orange text-white py-2 rounded-md font-bold hover:opacity-90">
                 Aplicar Filtros
               </button>
            </form>
         </div>
      </div>
    );
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 relative">
        <h3 className="text-2xl font-display text-gray-800 mb-4">Você viu todos por hoje!</h3>
        <button onClick={() => loadFeed(filters)} className="px-6 py-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-full font-semibold">
          Atualizar Feed
        </button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-md mx-auto relative mt-10">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowFilters(true)} className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 shadow border border-gray-200">
           Filtros Avançados
        </button>
      </div>
      {renderFilterModal()}
      
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
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
    </div>
  );
}
