import React from 'react';
import Faq from '../../components/Faq';
import type { FaqItem } from '../../types';

const faqItems: FaqItem[] = [
  {
    question: "O que é um relacionamento Sugar?",
    answer: "É uma relação baseada em transparência e alinhamento mútuo, onde ambas as partes expressam seus objetivos, expectativas e estilo de vida desde o início, sem as indefinições comuns de namoros tradicionais."
  },
  {
    question: "Como funciona a verificação de perfil?",
    answer: "Para manter a comunidade segura, cada usuário deve submeter uma selfie e documento de identidade. Nossa equipe analisa individualmente para validar o perfil, atribuindo o selo de verificação."
  },
  {
    question: "O Sweet Affinity é gratuito?",
    answer: "O cadastro, criação de perfil e visualização do feed básico são gratuitos. Para utilizar recursos avançados (como chat ilimitado e ver quem te curtiu), oferecemos planos Premium e Diamante."
  },
  {
    question: "Meus dados de verificação estão seguros?",
    answer: "Sim. Todos os documentos enviados para verificação são criptografados e armazenados em servidores seguros de acordo com a LGPD. Eles são utilizados estritamente para validação humana de identidade e excluídos de forma segura após o processo."
  },
  {
    question: "Como posso cancelar minha assinatura Premium?",
    answer: "Você pode cancelar a assinatura a qualquer momento diretamente na aba 'Configurações de Conta' no seu perfil. O acesso aos recursos continuará ativo até o final do período faturado."
  }
];

export default function FaqPage() {
  return (
    <div className="bg-neutral-gray min-h-screen">
      <Faq items={faqItems} />
    </div>
  );
}
