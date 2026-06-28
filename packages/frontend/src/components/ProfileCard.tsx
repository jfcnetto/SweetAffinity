
import React from 'react';
import type { Profile } from '../types';

const HeartIcon: React.FC<{ isFavorited: boolean }> = ({ isFavorited }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill={isFavorited ? '#FD267D' : 'white'} stroke={isFavorited ? '#FD267D' : 'white'} strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);


const ProfileCard: React.FC<{ profile: Profile; isFavorited: boolean; onToggleFavorite: (e: React.MouseEvent) => void; }> = ({ profile, isFavorited, onToggleFavorite }) => (
  <div className="group relative overflow-hidden rounded-lg shadow-lg h-80">
    <img src={profile.imageUrls[0]} alt={profile.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    <div className="absolute bottom-0 left-0 p-4 text-white">
      <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
      <p className="text-sm text-gray-300">{profile.location}</p>
    </div>
    <button
        onClick={onToggleFavorite}
        aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className="absolute top-2 right-2 z-10 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all duration-300 transform hover:scale-110"
    >
        <HeartIcon isFavorited={isFavorited} />
    </button>
    {profile.isVerified && (
        <div className="absolute top-2 left-2 z-10" title="Perfil Verificado">
            <svg className="h-6 w-6 text-blue-500 bg-white rounded-full p-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a.75.75 0 00-1.06-1.06L9 10.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l3.75-3.75z" clipRule="evenodd" />
            </svg>
        </div>
    )}
  </div>
);

export default ProfileCard;