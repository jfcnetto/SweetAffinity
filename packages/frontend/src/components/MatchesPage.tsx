import React, { useEffect, useState } from 'react';
import { MatchService, MatchListProfile } from '../services/match.service';
import toast from 'react-hot-toast';
import MessageModal from './MessageModal';
import { useAuth } from '../contexts/AuthContext';

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchListProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await MatchService.getMatches();
      setMatches(data);
    } catch (error) {
      toast.error('Erro ao carregar seus matches.');
    } finally {
      setLoading(false);
    }
  };

  const openChat = (profile: any) => {
    // Adapter profile payload for MessageModal format expected
    setSelectedMatch({
      id: profile.id,
      display_name: profile.displayName,
      primary_photo_url: profile.primaryPhotoUrl || null
    });
  };

  if (loading) {
    return <div className="p-8 text-center"><p className="text-gray-500">Buscando matches...</p></div>;
  }

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
        <h3 className="text-xl font-display text-gray-800 mb-2">Nenhum match ainda 😢</h3>
        <p className="text-gray-500 mb-6">Continue explorando o feed para encontrar sua conexão perfeita!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h2 className="text-3xl font-display font-bold text-gray-800 mb-8">Meus Matches</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div key={match.matchId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 bg-gradient-to-r from-gradient-pink to-gradient-orange opacity-80 flex items-center justify-center">
               <span className="text-white text-5xl font-bold opacity-30 uppercase">{match.profile.displayName[0]}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800">{match.profile.displayName}</h3>
              <p className="text-sm text-gray-500 capitalize mb-4">{match.profile.relationshipType}</p>
              <button 
                onClick={() => openChat(match.profile)}
                className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Enviar Mensagem
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedMatch && user && (
        <MessageModal
          recipient={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          isPremiumUser={user.isPremium || false}
          navigateTo={(page) => console.log('Navigate to:', page)}
          currentUserType={user.relationshipType as any}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
