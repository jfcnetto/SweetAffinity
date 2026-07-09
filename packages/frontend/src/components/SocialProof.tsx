import React from 'react';
import Image from 'next/image';

interface Testimonial {
  couple: string;
  quote: string;
  roles: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    couple: "Eduardo (Diretor de Investimentos)",
    quote: "O que me atraiu na plataforma foi a ausência de jogos mentais. Eu buscava apoiar alguém focado em crescer profissionalmente, e a Mariana tinha objetivos acadêmicos muito claros. Hoje, celebramos conquistas mútuas com base em acordos transparentes.",
    roles: "Parceiro de Mariana (Residente em Medicina)",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"
  },
  {
    couple: "Roberto (Empresário)",
    quote: "Diferente de outros apps, aqui fomos muito objetivos sobre nossas aspirações e estilo de vida. Essa clareza de expectativas nos permitiu construir uma dinâmica incrível de companheirismo com a Aline, sem espaço para frustrações comuns de relacionamentos tradicionais.",
    roles: "Parceiro de Aline (Designer de Moda)",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop"
  },
  {
    couple: "Beatriz (Arquiteta)",
    quote: "Encontrei no Carlos não apenas um parceiro generoso, mas um mentor que me ajudou a estruturar meu próprio estúdio de arquitetura. O alinhamento mútuo desde o primeiro dia fez toda a diferença no sucesso da nossa relação.",
    roles: "Parceira de Carlos (Fundador de Tech Startup)",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
  }
];

const SocialProof: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Parcerias baseadas em <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent font-black">Valores Mútuos</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            Histórias reais de quem escolheu a transparência como pilar fundamental de seus relacionamentos. Conexões inteligentes, mentoria e estilo de vida em perfeita sintonia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-pink-500/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Quote Icon */}
                <span className="text-5xl text-gradient-pink opacity-20 block mb-4 font-serif">“</span>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 italic">
                  {t.quote}
                </p>
              </div>

              <div className="flex items-center mt-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                  <Image
                    src={t.image}
                    alt={t.couple}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t.couple}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t.roles}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivating note */}
        <div className="mt-16 text-center max-w-2xl mx-auto border-t border-dashed border-gray-200 dark:border-gray-800 pt-12">
          <h3 className="text-sm text-gray-900 dark:text-white uppercase tracking-wider font-bold mb-3">
            Expectativas transparentes, conexões objetivas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light">
            Sabemos que o seu tempo é precioso.
            <br />
            O Sweet Affinity foi desenvolvido para quem deseja pular a fase de incertezas e suposições comuns dos encontros tradicionais.
            <br />
            Proporcionamos um ambiente maduro e seguro onde estilo de vida e objetivos são alinhados com clareza e respeito mútuo desde o primeiro dia.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
