
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroProps {
  onCtaClick: () => void;
}

const HERO_IMAGES = [
  // Casal elegante passeando em ambiente premium (estilo Europa)
  "https://images.unsplash.com/photo-1501901609772-df0848060b33?q=80&w=1200",
  // Encontro elegante à noite (jantar romântico sofisticado)
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200",
  // Casal elegante sorrindo e se abraçando em viagem
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1200",
  // Casal de braços dados em comemoração ou resort
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200"
];

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
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
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight mb-6 tracking-tight">
          Alinhamento de Estilo de Vida
          <br />
          <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent font-black">e Expectativas Claras</span>
        </h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto mb-10 text-gray-200 leading-relaxed font-light drop-shadow-md">
          Sweet Affinity é a plataforma exclusiva para quem valoriza a transparência. Conectamos pessoas determinadas e bem-sucedidas que buscam construir parcerias baseadas no respeito mútuo, apoio mútuo e clareza de objetivos desde o primeiro contato.
        </p>
        <button
          onClick={onCtaClick}
          className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold px-10 py-4.5 rounded-full text-base hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-900/20"
        >
          Iniciar Experiência
        </button>
      </div>
    </section>
  );
};

export default Hero;
