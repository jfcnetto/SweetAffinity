import { db } from '../db';
import { blogPosts } from '../db/schema';
import crypto from 'crypto';

// Simulação de chamada para API Gemini/ChatGPT
async function generateBlogArticle() {
  const niches = [
    'viagens incríveis para casais',
    'sugestões de presentes exclusivos',
    'como evitar golpes no mundo sugar',
    'experiências de vida sugar luxuosas',
    'datas comemorativas: surpreenda seu parceiro',
    'como planejar o jantar de dia dos namorados perfeito'
  ];

  const niche = niches[Math.floor(Math.random() * niches.length)];

  // Em produção, aqui seria uma chamada REST para a API do Google Gemini
  console.log(`[BlogGenerator] Solicitando artigo sobre: ${niche}`);

  const title = `Guia definitivo: ${niche.charAt(0).toUpperCase() + niche.slice(1)}`;
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  const content = `
    <h2>Por que isso é importante?</h2>
    <p>No universo de relacionamentos de alto nível, saber sobre <strong>${niche}</strong> é essencial para criar laços mais fortes e viver experiências memoráveis.</p>
    <p>Seja com viagens internacionais, segurança na comunicação ou presentes, o estilo de vida que você escolheu exige conhecimento.</p>
    <h3>Dica de Ouro</h3>
    <p>Aproveite a plataforma da Sweet Affinity para colocar essas dicas em prática agora mesmo!</p>
  `;

  return {
    title,
    slug,
    content,
    metaDescription: `Confira o nosso novo guia exclusivo sobre ${niche} no blog da Sweet Affinity. Dicas para sugar babies e daddies.`,
  };
}

export async function runDailyBlogCron() {
  console.log('[BlogGenerator] Iniciando rotina diária de geração de conteúdo SEO...');
  try {
    const article = await generateBlogArticle();
    
    // Para evitar slugs duplicados
    const uniqueSlug = `${article.slug}-${crypto.randomBytes(3).toString('hex')}`;

    await db.insert(blogPosts).values({
      title: article.title,
      slug: uniqueSlug,
      content: article.content,
      metaDescription: article.metaDescription,
    });

    console.log(`[BlogGenerator] Artigo "${article.title}" gerado e salvo com sucesso!`);
  } catch (error) {
    console.error('[BlogGenerator] Falha ao gerar artigo:', error);
  }
}
