
import React from 'react';

const AboutUs: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-dark-gray text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 font-display">Nossa Missão</h2>
        <p className="max-w-3xl mx-auto text-lg text-gray-300 mb-10">
          Nossa missão é criar um ambiente seguro, autêntico e de alto nível para pessoas que buscam relacionamentos baseados na transparência e em acordos mútuos. Acreditamos que a honestidade e a comunicação clara são os pilares para conexões bem-sucedidas. Valorizamos o respeito, o consentimento e a segurança de nossa comunidade acima de tudo.
        </p>
        <div className="border-t border-gray-700 pt-10">
             <h3 className="text-2xl font-bold mb-4 font-display">Sugestões de Nomes de Marca</h3>
             <p className="max-w-3xl mx-auto text-gray-400">
                Buscamos nomes originais, curtos e memoráveis, com domínios .com disponíveis, como:
             </p>
             <div className="flex flex-wrap justify-center gap-4 mt-6">
                <span className="bg-vibrant-orange/10 text-vibrant-orange text-sm font-medium px-4 py-2 rounded-full">AfinidadeDoce.com</span>
                <span className="bg-vibrant-orange/10 text-vibrant-orange text-sm font-medium px-4 py-2 rounded-full">CharmePrime.com</span>
                <span className="bg-vibrant-orange/10 text-vibrant-orange text-sm font-medium px-4 py-2 rounded-full">SugarLink.com</span>
                <span className="bg-vibrant-orange/10 text-vibrant-orange text-sm font-medium px-4 py-2 rounded-full">PactoDoce.com</span>
             </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
