
import React from 'react';

const ProfileCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="bg-white p-8 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300">
    <div className="mx-auto bg-gradient-pink/10 rounded-full h-20 w-20 flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold font-display mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const ProfileTypes: React.FC = () => {
  return (
    <section className="py-20 bg-neutral-gray">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 font-display text-gray-800">Encontre o seu Acordo Perfeito</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <ProfileCard
            title="Sugar Baby"
            description="Você é ambiciosa, atraente e sabe o que quer da vida. Busque um parceiro que possa oferecer suporte, mentoria e um estilo de vida elevado."
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gradient-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-5.243-7.494l10.486 0M4.155 12.002c0 4.334 3.51 7.844 7.845 7.844s7.845-3.51 7.845-7.844S16.334 4.158 12 4.158 4.155 7.668 4.155 12.002z" /></svg>}
          />
          <ProfileCard
            title="Sugar Daddy"
            description="Você é um homem bem-sucedido, generoso e experiente. Procure uma companhia inteligente e atraente para compartilhar os melhores momentos da vida."
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gradient-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <ProfileCard
            title="Sugar Mommy"
            description="Você é uma mulher poderosa, independente e generosa. Encontre um parceiro que admire seu sucesso e esteja pronto para uma jornada de luxo e cumplicidade."
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gradient-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          />
        </div>
      </div>
    </section>
  );
};

export default ProfileTypes;
