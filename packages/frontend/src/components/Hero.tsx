
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

interface HeroProps {
  onCtaClick: () => void;
}

const HERO_IMAGES = [
  "/images/hero/hero-couple-strolling.jpg",
  "/images/hero/hero-romantic-dinner.jpg",
  "/images/hero/hero-couple-travel.jpg",
  "/images/hero/hero-luxury-resort.jpg"
];

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const { isAuthenticated } = useAuth();
  const [heroImage, setHeroImage] = useState(HERO_IMAGES[0]);

  useEffect(() => {
    // Escolhe uma imagem aleatória a cada carregamento de página
    const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
    setHeroImage(HERO_IMAGES[randomIndex]);
  }, []);

  return (
    <section className="relative bg-gray-900 text-white h-[70vh] flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0">
        <Image 
          src={heroImage} 
          alt="Estilo de vida Sweet Affinity" 
          fill
          className="object-cover opacity-45 transition-opacity duration-1000" 
          priority
        />
        {/* Degradê sutil para garantir legibilidade mantendo a imagem visível */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-gray-900/60 to-gray-950/80" />
      </div>
      <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-4 sm:mb-6 tracking-tight px-2">
          Alinhamento de Estilo de Vida
          <br />
          <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent font-black">e Expectativas Claras</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 text-gray-200 leading-relaxed font-light drop-shadow-md px-4">
          Sweet Affinity é a plataforma exclusiva para quem valoriza a transparência. Conectamos pessoas determinadas e bem-sucedidas que buscam construir parcerias baseadas no respeito mútuo, apoio mútuo e clareza de objetivos desde o primeiro contato.
        </p>
        {!isAuthenticated && (
          <button
            onClick={onCtaClick}
            className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold px-8 md:px-10 py-3 md:py-4 rounded-full text-sm sm:text-base hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-900/20 w-[90%] sm:w-auto mx-auto"
          >
            Iniciar Experiência
          </button>
        )}
      </div>
    </section>
  );
};

export default Hero;
