
import React from 'react';

interface HeroProps {
  onSignUpClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onSignUpClick }) => {
  return (
    <section className="relative bg-gray-900 text-white h-[70vh] flex items-center justify-center text-center">
      <div className="absolute inset-0">
        <img src="https://picsum.photos/seed/hero/1920/1080" alt="Casal elegante" className="w-full h-full object-cover opacity-30" />
      </div>
      <div className="relative z-10 p-6">
        <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-4">
          Relacionamentos de Alto Nível.
          <br />
          Expectativas Claras.
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-200">
          Conectamos pessoas bem-sucedidas e ambiciosas para relacionamentos transparentes, com benefícios mútuos e respeito.
        </p>
        <button
          onClick={onSignUpClick}
          className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-bold px-10 py-4 rounded-full text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Criar Perfil Gratuito
        </button>
      </div>
    </section>
  );
};

export default Hero;
