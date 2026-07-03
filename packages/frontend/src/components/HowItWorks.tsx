
import React from 'react';

const Step: React.FC<{ number: string; title: string; description: string; icon: JSX.Element }> = ({ number, title, description, icon }) => (
  <div className="text-center">
    <div className="relative mb-6">
      <div className="mx-auto bg-white rounded-full h-24 w-24 flex items-center justify-center shadow-lg border-2 border-gradient-pink">
        {icon}
      </div>
      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-bold rounded-full h-8 w-8 flex items-center justify-center">{number}</span>
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16 font-display text-gray-800">Como Funciona</h2>
        <div className="grid md:grid-cols-4 gap-12">
          <Step
            number="1"
            title="Crie seu Perfil"
            description="Cadastre-se gratuitamente em minutos. Descreva seus interesses, estilo de vida e o que você busca em um relacionamento."
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#FF5864]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          />
          <Step
            number="2"
            title="Verificação de Identidade"
            description="Para a segurança de todos, realizamos uma verificação de identidade com documento ou selfie. Perfis verificados ganham um selo de confiança."
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#FF5864]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 019-2.611m3.076-5.357A12.026 12.026 0 0121 20.944a11.955 11.955 0 01-9 2.611m0 0a11.955 11.955 0 01-2.612-3.076m-2.098-5.36A12.026 12.026 0 013 20.944" /></svg>}
          />
          <Step
            number="3"
            title="Conecte-se"
            description="Utilize nossos filtros para encontrar perfis compatíveis. Envie mensagens, demonstre interesse e comece a conversar."
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#FF5864]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
          <Step
            number="4"
            title="Inicie o Acordo"
            description="Quando encontrar alguém especial, defina os termos do relacionamento com clareza e honestidade. Viva a sua Sweet Affinity!"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#FF5864]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;