import React from 'react';

const TermsOfUse: React.FC = () => {
  return (
    <section id="terms" className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-12 font-display text-gray-800">Termos e Condições de Uso</h2>
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">1. Aceitação dos Termos</h3>
            <p>
              Ao acessar e utilizar o Sweet Affinity ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos e Condições de Uso ("Termos"). Se você não concorda com estes Termos, não deve acessar ou usar a Plataforma. Reservamo-nos o direito de modificar estes Termos a qualquer momento.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">2. Elegibilidade</h3>
            <p>
              Você deve ter pelo menos 18 anos de idade para criar uma conta no Sweet Affinity e usar a Plataforma. Ao usar a Plataforma, você declara e garante que tem o direito, a autoridade e a capacidade de celebrar estes Termos.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">3. Conduta do Usuário</h3>
            <p>
              Você concorda em usar a Plataforma de maneira legal, respeitosa e ética. Você não irá:
            </p>
            <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
              <li>Publicar conteúdo ilegal, ofensivo, difamatório, odioso ou sexualmente explícito.</li>
              <li>Utilizar a Plataforma para solicitar ou se envolver em prostituição, trabalho sexual ou qualquer atividade ilegal.</li>
              <li>Assediar, intimidar ou ameaçar outros usuários.</li>
              <li>Usar a conta de outra pessoa ou se passar por outra pessoa.</li>
              <li>Coletar informações de outros usuários sem o consentimento deles.</li>
            </ul>
            <p className="mt-2">
                A violação dessas regras resultará na suspensão ou encerramento imediato de sua conta, sem reembolso.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">4. Verificação de Identidade</h3>
            <p>
                Para garantir um ambiente seguro e autêntico, com pessoas reais, e minimizar a presença de perfis falsos, exigimos um processo de verificação de identidade. Você deverá enviar uma foto de um documento de identificação válido (RG, CNH ou Passaporte) e uma selfie segurando o mesmo documento. Nossa equipe realizará uma verificação humanizada de cada novo cadastro. Este processo pode levar um tempo para ser concluído e seu acesso à plataforma só será liberado após a aprovação.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">5. Segurança da Conta</h3>
            <p>
              Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">6. Assinaturas e Pagamentos</h3>
            <p>
              Oferecemos planos de assinatura pagos que fornecem recursos adicionais. Todas as taxas de assinatura não são reembolsáveis. A assinatura será renovada automaticamente, a menos que seja cancelada antes do final do período de faturamento atual.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-display mb-3">7. Rescisão</h3>
            <p>
              Podemos suspender ou encerrar sua conta a qualquer momento, por qualquer motivo, incluindo, sem limitação, a violação destes Termos. Você pode encerrar sua conta a qualquer momento através das configurações do seu perfil.
            </p>
          </div>
           <div>
            <h3 className="text-2xl font-semibold font-display mb-3">8. Isenção de Garantias e Limitação de Responsabilidade</h3>
            <p>
              A Plataforma é fornecida "como está". Não garantimos a precisão, segurança ou confiabilidade da Plataforma ou de seu conteúdo. Não somos responsáveis por qualquer dano direto ou indireto resultante do uso da Plataforma. Encontros e interações com outros usuários são de sua exclusiva responsabilidade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TermsOfUse;