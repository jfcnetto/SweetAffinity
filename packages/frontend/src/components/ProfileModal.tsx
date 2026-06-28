import React, { useState } from 'react';
import type { Profile } from '../types';

interface ProfileModalProps {
  profile: Profile;
  onClose: () => void;
  navigateTo: (page: string) => void;
  onSendMessage: (profile: Profile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose, navigateTo, onSendMessage }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Simulação: o usuário não tem plano premium
  const isPremiumUser = false;
  const FREE_PHOTO_LIMIT = 5;

  const totalPhotos = profile.imageUrls.length;
  const isLocked = !isPremiumUser && currentIndex >= FREE_PHOTO_LIMIT;

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? totalPhotos - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === totalPhotos - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  const handleUpgradeClick = () => {
      onClose(); // Fecha o modal de perfil
      navigateTo('plans'); // Navega para a página de planos
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full relative transform transition-all animate-fade-in-down overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-30 bg-white/50 rounded-full p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2">
            <div className="relative group">
              <div className="w-full h-full min-h-[400px] md:min-h-[500px] bg-gray-200">
                <img 
                    src={profile.imageUrls[currentIndex]} 
                    alt={`${profile.name} - Foto ${currentIndex + 1}`} 
                    className={`w-full h-full object-cover transition-all duration-300 ${isLocked ? 'blur-md' : ''}`} 
                />
              </div>

              {isLocked && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center text-white p-4 z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <h3 className="text-2xl font-bold font-display">Veja mais {totalPhotos - FREE_PHOTO_LIMIT} fotos</h3>
                    <p className="mb-6">Assine um de nossos planos para ter acesso a todas as fotos do perfil.</p>
                    <button onClick={handleUpgradeClick} className="bg-gradient-to-r from-gradient-pink to-gradient-orange font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity duration-300">
                        Ver Planos
                    </button>
                </div>
              )}

              {/* Controles do Carrossel */}
              <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
                {currentIndex + 1} / {totalPhotos}
              </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white z-10">
                    <div className="flex items-center gap-2">
                        <h2 className="text-4xl font-bold font-display">{profile.name}, {profile.age}</h2>
                        {profile.isVerified && (
                            <div title="Perfil Verificado">
                                <svg className="h-7 w-7 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a.75.75 0 00-1.06-1.06L9 10.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l3.75-3.75z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <p className="text-lg">{profile.location}</p>
                </div>
            </div>

            <div className="p-8 flex flex-col justify-between">
                <div>
                    {profile.isVerified && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-start gap-4">
                            <div className="flex-shrink-0 text-blue-500">
                                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a.75.75 0 00-1.06-1.06L9 10.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l3.75-3.75z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Perfil Verificado</h4>
                                <p className="text-sm text-gray-600 mt-1">Este usuário completou nosso processo de verificação de identidade para garantir mais segurança e autenticidade.</p>
                            </div>
                        </div>
                    )}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold font-display text-gray-800 mb-2">Sobre mim</h3>
                        <p className="text-gray-600">
                            Sou uma pessoa ambiciosa e determinada, apaixonada por viagens, gastronomia e arte. Busco alguém para compartilhar experiências incríveis e momentos inesquecíveis, com base na honestidade e no respeito mútuo.
                        </p>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-xl font-bold font-display text-gray-800 mb-2">Interesses</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-gradient-pink/10 text-gradient-pink text-sm font-medium px-3 py-1 rounded-full">Viagens</span>
                            <span className="bg-gradient-pink/10 text-gradient-pink text-sm font-medium px-3 py-1 rounded-full">Culinária</span>
                            <span className="bg-gradient-pink/10 text-gradient-pink text-sm font-medium px-3 py-1 rounded-full">Arte e Cultura</span>
                            <span className="bg-gradient-pink/10 text-gradient-pink text-sm font-medium px-3 py-1 rounded-full">Networking</span>
                        </div>
                    </div>
                     <div className="mb-6">
                        <h3 className="text-xl font-bold font-display text-gray-800 mb-2">O que busco</h3>
                        <p className="text-gray-600">
                           Procuro um parceiro generoso, inteligente e bem-sucedido que possa me oferecer mentoria e um estilo de vida elevado. Valorizo a transparência e a boa comunicação.
                        </p>
                    </div>
                </div>

                 <button onClick={() => onSendMessage(profile)} className="w-full mt-4 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink">
                    Enviar Mensagem
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
