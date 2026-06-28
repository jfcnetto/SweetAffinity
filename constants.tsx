import React from 'react';
import type { Profile, Plan, FaqItem, Article, Message } from './types';

export const NAV_LINKS = [
  { name: 'Como Funciona', pageId: 'how-it-works' },
  { name: 'Planos', pageId: 'plans' },
  { name: 'Blog', pageId: 'blog' },
  { name: 'FAQ', pageId: 'faq' },
  { name: 'Sobre Nós', pageId: 'about' },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 1, text: 'Olá, Juliana! Adorei o seu perfil. 😊', timestamp: '10:30', sender: 'me' },
  { id: 2, text: 'Olá! Obrigada. Que bom que gostou.', timestamp: '10:32', sender: 'other' },
  { id: 3, text: 'Você parece ser uma pessoa muito interessante. Gostaria de conversar mais?', timestamp: '10:33', sender: 'me' },
  { id: 4, text: 'Claro! Adoraria.', timestamp: '10:35', sender: 'other' },
];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

const generateImageUrls = (seed: string, count: number): string[] => {
    return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}${i + 1}/800/1200`);
};

export const SUGAR_BABIES: Profile[] = [
  { id: 1, name: 'Juliana', age: 23, location: 'São Paulo, SP', imageUrls: generateImageUrls('sb1', 20), type: 'Baby', popularity: 95, registeredDate: new Date().toISOString(), distance: 5, isVerified: true, maritalStatus: 'Solteiro(a)', height: '1.60m - 1.70m', ethnicity: 'Latino/Hispânico', hairColor: 'Castanho', eyeColor: 'Castanho', smoking: 'Nunca', drinking: 'Socialmente', education: 'Superior Completo' },
  { id: 2, name: 'Beatriz', age: 21, location: 'Rio de Janeiro, RJ', imageUrls: generateImageUrls('sb2', 20), type: 'Baby', popularity: 88, registeredDate: threeDaysAgo.toISOString(), distance: 350, isVerified: false, maritalStatus: 'Solteiro(a)', height: '1.50m - 1.60m', ethnicity: 'Branco/Caucasiano', hairColor: 'Loiro', eyeColor: 'Azul', smoking: 'Socialmente', drinking: 'Socialmente', education: 'Superior Incompleto' },
  { id: 3, name: 'Larissa', age: 25, location: 'Belo Horizonte, MG', imageUrls: generateImageUrls('sb3', 20), type: 'Baby', popularity: 92, registeredDate: yesterday.toISOString(), distance: 580, isVerified: true, maritalStatus: 'Em um relacionamento', height: '1.70m - 1.80m', ethnicity: 'Negro/Afrodescendente', hairColor: 'Preto', eyeColor: 'Preto', smoking: 'Nunca', drinking: 'Nunca', education: 'Pós-graduação' },
  { id: 4, name: 'Camila', age: 22, location: 'Curitiba, PR', imageUrls: generateImageUrls('sb4', 20), type: 'Baby', popularity: 85, registeredDate: threeDaysAgo.toISOString(), distance: 25, isVerified: false, maritalStatus: 'Solteiro(a)', height: '1.60m - 1.70m', ethnicity: 'Asiático', hairColor: 'Preto', eyeColor: 'Castanho', smoking: 'Nunca', drinking: 'Socialmente', education: 'Superior Completo' },
];

export const SUGAR_DADDIES_MOMMIES: Profile[] = [
  { id: 1, name: 'Ricardo', age: 45, location: 'São Paulo, SP', imageUrls: generateImageUrls('sd1', 20), type: 'Daddy', popularity: 98, registeredDate: threeDaysAgo.toISOString(), distance: 8, isVerified: true, maritalStatus: 'Divorciado(a)', height: '1.80m - 1.90m', ethnicity: 'Branco/Caucasiano', hairColor: 'Grisalho', eyeColor: 'Verde', smoking: 'Socialmente', drinking: 'Frequentemente', education: 'Doutorado' },
  { id: 2, name: 'Fernando', age: 52, location: 'Brasília, DF', imageUrls: generateImageUrls('sd2', 20), type: 'Daddy', popularity: 91, registeredDate: new Date().toISOString(), distance: 870, isVerified: false, maritalStatus: 'Separado(a)', height: '1.70m - 1.80m', ethnicity: 'Latino/Hispânico', hairColor: 'Preto', eyeColor: 'Castanho', smoking: 'Nunca', drinking: 'Socialmente', education: 'Mestrado' },
  { id: 3, name: 'Cláudia', age: 48, location: 'Porto Alegre, RS', imageUrls: generateImageUrls('sm1', 20), type: 'Mommy', popularity: 93, registeredDate: yesterday.toISOString(), distance: 1100, isVerified: true, maritalStatus: 'Viúvo(a)', height: '1.60m - 1.70m', ethnicity: 'Branco/Caucasiano', hairColor: 'Loiro', eyeColor: 'Azul', smoking: 'Nunca', drinking: 'Socialmente', education: 'Pós-graduação' },
  { id: 4, name: 'Roberto', age: 55, location: 'Salvador, BA', imageUrls: generateImageUrls('sd3', 20), type: 'Daddy', popularity: 89, registeredDate: threeDaysAgo.toISOString(), distance: 15, isVerified: false, maritalStatus: 'Divorciado(a)', height: '1.80m - 1.90m', ethnicity: 'Negro/Afrodescendente', hairColor: 'Grisalho', eyeColor: 'Castanho', smoking: 'Frequentemente', drinking: 'Frequentemente', education: 'Superior Completo' },
];

export const PLANS: Plan[] = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    features: ['Cadastro e perfil visível', 'Receber mensagens', 'Filtros básicos de busca', 'Suporte por e-mail'],
    highlight: false,
  },
  {
    name: 'Premium',
    price: 'R$ 299/mês',
    features: [
      'Todos os benefícios do Gratuito',
      'Enviar mensagens ilimitadas',
      'Ver quem visitou seu perfil',
      'Selo de perfil verificado',
      'Acesso a conteúdo exclusivo',
      'Suporte prioritário via chat',
    ],
    highlight: true,
  },
  {
    name: 'Diamante',
    price: 'R$ 499/mês',
    features: [
      'Todos os benefícios do Premium',
      'Perfil promovido em destaque',
      'Filtros de busca avançados',
      'Indicadores de compatibilidade',
      'Acesso a eventos online',
      'Consultoria de perfil',
    ],
    highlight: false,
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'O que é um relacionamento Sugar?',
    answer: 'É um relacionamento baseado em transparência, honestidade e benefícios mútuos. Envolve uma pessoa bem-sucedida (Sugar Daddy/Mommy) e uma pessoa atraente (Sugar Baby) que buscam um acordo claro e consensual.',
  },
  {
    question: 'A plataforma é segura?',
    answer: 'Sim. A segurança é nossa prioridade. Todos os perfis passam por uma verificação humana rigorosa para garantir a autenticidade e a qualidade da nossa comunidade. Usamos criptografia SSL e temos políticas claras contra comportamentos inadequados.',
  },
  {
    question: 'Este site promove trabalho sexual?',
    answer: 'Não. De forma alguma. Nossas políticas proíbem estritamente qualquer forma de trabalho sexual, prostituição ou acordos comerciais explícitos. Focamos em construir relacionamentos genuínos baseados em consentimento e respeito mútuo.',
  },
  {
    question: 'Como funciona a verificação de perfis?',
    answer: 'Após o cadastro, você deve enviar fotos e dados reais. Nossa equipe de moderação analisa cada perfil manualmente para aprovação. Esse processo garante que apenas membros genuínos e comprometidos com nossos valores façam parte da comunidade.',
  },
];

export const BLOG_ARTICLES: Article[] = [
    {
        title: 'As Vantagens de um Relacionamento Sugar',
        summary: 'Descubra os benefícios que vão além do financeiro, incluindo mentoria, networking e experiências únicas.',
        imageUrl: 'https://picsum.photos/seed/blog1/600/400',
    },
    {
        title: 'Segurança em Primeiro Lugar: Dicas Essenciais',
        summary: 'Como navegar no universo sugar com confiança, desde o primeiro contato até o encontro presencial.',
        imageUrl: 'https://picsum.photos/seed/blog2/600/400',
    },
    {
        title: 'A Arte da Comunicação Honesta no Mundo Sugar',
        summary: 'Aprenda a estabelecer expectativas claras e a manter uma comunicação transparente para um acordo de sucesso.',
        imageUrl: 'https://picsum.photos/seed/blog3/600/400',
    },
];
