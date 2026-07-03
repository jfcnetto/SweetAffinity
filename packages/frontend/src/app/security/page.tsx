import React from 'react';

export default function SecurityPage() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 font-display text-gray-800">Diretrizes de Segurança da Comunidade</h1>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div className="bg-red-600 dark:bg-red-700 text-white p-6 rounded-2xl mb-8 shadow-md">
            <h2 className="text-xl font-bold mb-2">Aviso Importante sobre Segurança Pessoal</h2>
            <p className="text-sm font-medium leading-relaxed">
              O Sweet Affinity é uma plataforma de matchmaking (aproximação e intermediação online). <strong className="underline font-extrabold">Não somos responsáveis por encontros presenciais ou por ações offline dos usuários</strong>. Sua segurança depende de comportamentos preventivos. Use a plataforma de forma madura e responsável.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">1. Proteção de Dados e Infraestrutura</h2>
            <p>
              Adotamos criptografia de ponta a ponta (SSL/TLS) para todas as comunicações em nossa plataforma. Os dados confidenciais e de pagamento são gerenciados pelo Stripe, utilizando as melhores práticas globais de conformidade (PCI-DSS). Documentos de identidade são armazenados sob criptografia dedicada e mascarados após o processo de validação.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">2. Moderação Ativa e Denúncias</h2>
            <p>
              Temos tolerância zero para abusos, comportamentos ilegais ou assédio. Nossa equipe de moderação monitora ativamente denúncias de perfis suspeitos, golpistas ou contas que infringem nossos Termos de Uso. Usuários suspensos ou banidos por infrações graves de segurança não terão direito a novos cadastros.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">3. Recomendações Críticas para Encontros Offline</h2>
            <p className="mb-2">Ao decidir agendar um encontro presencial com um parceiro encontrado na plataforma, siga sempre estas regras de ouro:</p>
            <ul className="list-disc list-inside pl-4 space-y-1.5">
              <li><strong>Escolha Locais Públicos:</strong> Sempre agende os primeiros encontros em cafeterias, shoppings ou restaurantes movimentados. Nunca agende em residências ou hotéis privados.</li>
              <li><strong>Avise Alguém de Confiança:</strong> Compartilhe a localização em tempo real com um amigo ou familiar.</li>
              <li><strong>Transporte Próprio:</strong> Vá e volte do encontro utilizando seu próprio meio de transporte ou serviços de aplicativo confiáveis. Não aceite carona na primeira data.</li>
              <li><strong>Não Transfira Dinheiro:</strong> Nunca envie dinheiro, Pix, empréstimos ou dados bancários a usuários sob nenhuma circunstância. A plataforma proíbe transações financeiras informais fora da assinatura de serviços oficiais.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
