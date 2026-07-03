import React from 'react';

export default function PrivacyPage() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 font-display text-gray-800">Política de Privacidade e Proteção de Dados (LGPD)</h1>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-2xl font-semibold mb-3">1. Compromisso com a Privacidade</h2>
            <p>
              O Sweet Affinity valoriza a privacidade e a segurança de seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/18 - LGPD).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">2. Informações que Coletamos</h2>
            <p className="mb-2">Coletamos informações necessárias para a prestação de nossos serviços de matchmaking:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li><strong>Dados de Registro:</strong> Nome completo, e-mail, senha, data de nascimento, gênero e localização.</li>
              <li><strong>Dados de Perfil:</strong> Biografia, fotos, interesses, estilo de vida e preferências de relacionamento.</li>
              <li><strong>Dados de Verificação:</strong> Fotos de documentos oficiais (RG, CNH ou Passaporte) e uma selfie segurando o documento.</li>
              <li><strong>Dados Financeiros:</strong> Informações de pagamento processadas de forma segura e direta pelo nosso parceiro Stripe (não armazenamos dados de cartão de crédito em nossos servidores).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">3. Uso dos Dados de Verificação</h2>
            <p>
              As fotos de documentos e selfies enviadas para fins de verificação de identidade são utilizadas <strong>exclusivamente para comprovação humana de autenticidade</strong> e proteção contra perfis falsos ou golpistas. Estes documentos são armazenados de forma criptografada e são descartados ou mascarados de nossos sistemas ativos assim que a verificação manual é aprovada ou rejeitada por nossa equipe de segurança.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
            <p>
              O Sweet Affinity não vende, aluga ou compartilha suas informações pessoais com terceiros para fins de marketing. Seus dados de perfil público (fotos, bio, etc.) são visíveis para outros usuários da plataforma a fim de possibilitar conexões.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">5. Seus Direitos (LGPD)</h2>
            <p className="mb-2">Como titular dos dados, você tem direito a:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Confirmar a existência do tratamento de seus dados.</li>
              <li>Acessar seus dados pessoais cadastrados na plataforma.</li>
              <li>Solicitar a correção de dados incompletos ou inexatos.</li>
              <li>Solicitar a exclusão definitiva de seus dados e conta de nossos sistemas.</li>
            </ul>
            <p className="mt-2">Essas solicitações podem ser feitas diretamente através das configurações de sua conta ou entrando em contato com nosso Encarregado de Proteção de Dados (DPO).</p>
          </div>
        </div>
      </div>
    </section>
  );
}
