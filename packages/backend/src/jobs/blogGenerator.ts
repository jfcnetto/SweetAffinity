import { db } from '../db/index.js';
import { blogPosts } from '../db/schema.js';
import crypto from 'crypto';

export let lastLlmError: string | null = null;
export function getLastLlmError() { return lastLlmError; }
export function clearLastLlmError() { lastLlmError = null; }

// Artigos ricos pré-configurados para fallback de alta qualidade (SEO 800+ palavras e imagens reais)
const RICH_FALLBACK_ARTICLES = [
  {
    niche: 'como planejar o jantar de dia dos namorados perfeito',
    title: 'Como Planejar o Jantar de Dia dos Namorados Perfeito: Guia de Luxo',
    imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800',
    metaDescription: 'Descubra como planejar um jantar romântico inesquecível de dia dos namorados, com dicas de menu, vinhos e decoração sofisticada.',
    content: `
      <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800" alt="Jantar Romântico de Luxo" class="w-full rounded-2xl mb-6 shadow-md object-cover max-h-[400px]" />
      <h2>A Arte de Celebrar a Dois com Sofisticação</h2>
      <p>Planejar um jantar de Dia dos Namorados que saia do óbvio exige atenção aos mínimos detalhes. Quando falamos de estilo de vida de alto nível, a comemoração ideal une privacidade, gastronomia refinada e uma atmosfera mágica. Evitar restaurantes lotados e barulhentos costuma ser a primeira escolha de casais que valorizam a exclusividade e a cumplicidade.</p>
      
      <h3>1. A Escolha do Ambiente: Intimista e Acolhedor</h3>
      <p>Seja contratando um chef particular para cozinhar em sua residência ou alugando um lounge privativo, o espaço deve exalar conforto. A iluminação desempenha um papel crucial: apague as luzes diretas e aposte em velas aromáticas de fragrâncias suaves (como sândalo ou baunilha) para criar sombras aconchegantes. A trilha sonora deve ser suave, preferencialmente jazz instrumental ou bossa nova em volume de fundo.</p>
      
      <h3>2. Menu Gastronômico e Harmonização</h3>
      <p>O cardápio deve ser leve para garantir que a noite continue agradável após a refeição. Entradas com frutos do mar, como ostras frescas ou carpaccio de vieiras, são escolhas clássicas. Para o prato principal, um risoto de trufas negras com filé mignon ou um robalo grelhado com crosta de ervas são excelentes opções. A harmonização com vinhos finos ou champanhe francês de safras selecionadas eleva a experiência.</p>
      
      <h3>3. Detalhes que Demonstram Cuidado</h3>
      <p>Flores frescas são indispensáveis, mas evite arranjos muito altos que bloqueiem a visão entre você e seu parceiro. Cartões escritos à mão e pequenos presentes personalizados entregues durante o brinde tornam o momento inesquecível. Para mais referências sobre alta gastronomia e estilo, consulte guias renomados como o <a href="https://www.vogue.com" target="_blank" rel="noopener noreferrer">portal de tendências Vogue</a>.</p>
    `
  },
  {
    niche: 'viagens incríveis para casais',
    title: 'Destinos de Luxo: Viagens Incríveis para Casais Viverem o Extraordinário',
    imageUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=800',
    metaDescription: 'Conheça os melhores destinos de luxo para casais, desde praias privativas nas Maldivas até refúgios históricos na Europa.',
    content: `
      <img src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=800" alt="Viagem de Casal Premium" class="w-full rounded-2xl mb-6 shadow-md object-cover max-h-[400px]" />
      <h2>Explorando o Mundo com Exclusividade</h2>
      <p>Viajar a dois é uma das melhores maneiras de estreitar laços e criar memórias eternas. Para casais que buscam experiências premium, o destino ideal deve oferecer total privacidade, serviços de concierge de altíssimo padrão e paisagens de tirar o fôlego. Longe do turismo de massa, selecionamos refúgios perfeitos para a sua próxima escapada.</p>
      
      <h3>1. Maldivas: O Paraíso dos Bangalôs Sobre a Água</h3>
      <p>As Ilhas Maldivas continuam sendo o sinônimo supremo de romance e privacidade. Hospedar-se em um resort de ilha privativa, onde cada bangalô possui sua própria piscina de borda infinita e acesso direto às águas mornas e cristalinas do Oceano Índico, proporciona uma desconexão completa do estresse cotidiano. Jantares à luz de velas na areia e spas privativos completam a experiência dos sonhos.</p>
      
      <h3>2. Costa Amalfitana: Charme e História na Itália</h3>
      <p>Para quem prefere a sofisticação europeia, a Costa Amalfitana oferece vilas históricas encravadas em penhascos, com vista para o Mar Tirreno. Alugar um iate privativo para navegar por Capri e Positano durante o pôr do sol é um clássico indispensável. A gastronomia mediterrânea estrelada pelo guia Michelin e os vinhos locais completam a atmosfera romântica.</p>
      
      <h3>3. Planejamento Impecável e Dicas Práticas</h3>
      <p>Para garantir que a viagem ocorra sem imprevistos, conte sempre com agentes de viagens especializados em turismo de luxo. Faça reservas com bastante antecedência, principalmente para hotéis boutique e jantares exclusivos. Para dicas atualizadas sobre malas e tendências de moda de viagem, veja o <a href="https://www.vogue.com" target="_blank" rel="noopener noreferrer">portal de moda de viagem Vogue</a>.</p>
    `
  },
  {
    niche: 'como evitar golpes no mundo sugar',
    title: 'Guia de Segurança Sugar: Como Evitar Golpes e Proteger sua Privacidade',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=800',
    metaDescription: 'Dicas práticas de segurança e privacidade para Sugar Babies e Daddies aproveitarem a plataforma com total tranquilidade.',
    content: `
      <img src="https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=800" alt="Segurança e Privacidade" class="w-full rounded-2xl mb-6 shadow-md object-cover max-h-[400px]" />
      <h2>Construindo Relações Seguras e Transparentes</h2>
      <p>O relacionamento Sugar é baseado em acordos claros, respeito mútuo e transparência. Para garantir que sua experiência seja positiva e livre de riscos, adotar hábitos preventivos de segurança e proteger seus dados pessoais é fundamental. Reunimos as principais diretrizes recomendadas por especialistas em privacidade digital.</p>
      
      <h3>1. Mantenha a Comunicação na Plataforma</h3>
      <p>Durante as primeiras conversas, evite compartilhar redes sociais pessoais ou números de telefone. Golpistas costumam tentar retirar a conversa da plataforma oficial rapidamente para evitar os filtros de moderação da Sweet Affinity. Utilize o chat seguro do aplicativo até que haja confiança estabelecida para dar o próximo passo.</p>
      
      <h3>2. O Primeiro Encontro: Sempre em Local Público</h3>
      <p>Ao marcar o primeiro encontro presencial, escolha locais públicos, movimentados e bem iluminados, como cafeterias conceituadas, restaurantes ou lobbies de hotéis de prestígio. Nunca aceite ser buscada em casa ou ir a ambientes privados no primeiro contato. Avise um amigo de confiança sobre o local e horário do encontro.</p>
      
      <h3>3. Transações Financeiras Seguras</h3>
      <p>Nunca envie dinheiro adiantado e desconfie de promessas excessivas antes do estabelecimento de uma relação real. Plataformas de pagamento seguras e integradas devem ser priorizadas. Proteja suas informações bancárias e siga boas práticas de cibersegurança recomendadas por órgãos de proteção digital.</p>
    `
  }
];

// Geração de artigo via LLM (Suporta Abacus)
async function generateBlogArticle() {
  const niches = [
    'viagens incríveis para casais em resorts de luxo',
    'sugestões de presentes exclusivos e joias',
    'como evitar golpes no mundo sugar e proteger sua privacidade',
    'como planejar o jantar romântico perfeito',
    'destinos exóticos na europa para casais exigentes',
    'dicas de etiqueta e elegância para encontros de alto padrão',
    'o guia definitivo sobre finanças e mesadas em relacionamentos transparentes',
    'como construir um relacionamento sugar duradouro e com respeito',
    'dicas de segurança em primeiros encontros: lugares públicos e luxuosos',
    'presentes que encantam: bolsas de grife e relógios',
    'viagens para o caribe: como escolher o melhor roteiro a dois',
    'os melhores vinhos e champanhes para celebrar a dois',
    'guia de moda e estilo: como se vestir para impressionar em encontros luxuosos',
    'como equilibrar expectativas financeiras desde o início do relacionamento',
    'a arte de presentear: experiências exclusivas versus bens materiais'
  ];
  const niche = niches[Math.floor(Math.random() * niches.length)];

  const abacusKey = process.env.ABACUS_API_KEY;

  const prompt = `Escreva um artigo de blog completo e otimizado para SEO em português sobre o tema do universo de relacionamentos Sugar, Luxo e Lifestyle: "${niche}".
O artigo deve ser escrito no formato HTML, contendo tags estruturadas como <h2>, <h3>, <p>, <strong>, <ul> e <li>.
O texto deve ser detalhado, cativante, possuir um tom de sofisticação e ter pelo menos 800 palavras.
Insira links externos relevantes e confiáveis para referências de viagem, etiqueta ou finanças que agreguem valor para o leitor e melhorem o SEO.
NÃO inclua nenhuma tag de imagem (<img />). Eu cuidarei da imagem no backend para garantir que seja uma foto de luxo perfeita.

Também forneça um campo "imagePrompt", que DEVE estar em INGLÊS. Este será usado para gerar uma imagem via IA geradora de imagens (como Midjourney/DALL-E). O "imagePrompt" deve ser extremamente descritivo, fotorealista, cinematográfico, de alta qualidade e totalmente alinhado com o contexto do artigo.

Retorne a resposta no seguinte formato JSON estrito, sem decorações markdown como \`\`\`json no início ou no fim:
{
  "title": "Título atraente do artigo",
  "content": "Conteúdo HTML completo do artigo (sem tags de imagem)",
  "metaDescription": "Descrição SEO de até 150 caracteres",
  "imagePrompt": "English descriptive prompt for image generation, e.g. 'luxurious sunset over Amalfi coast, hyper realistic, cinematic lighting, ultra detailed'"
}`;

  // 1. SUPORTE ABACUS AI
  if (abacusKey) {
    console.log(`[BlogGenerator] Gerando via Abacus.AI sobre: ${niche}`);
    try {
      const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${abacusKey}`
        },
        body: JSON.stringify({
          model: "route-llm",
          messages: [
            { role: "user", content: prompt + "\nRetorne APENAS o JSON estrito. Não adicione textos adicionais fora do JSON." }
          ],
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (responseText) {
          let cleanText = responseText.trim();
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
          }
          const parsed = JSON.parse(cleanText);
          const slug = parsed.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          return { 
            title: parsed.title, 
            slug, 
            content: parsed.content, 
            metaDescription: parsed.metaDescription,
            imagePrompt: parsed.imagePrompt || "luxurious lifestyle, hyper realistic, high quality" 
          };
        }
      } else {
        const errText = await response.text();
        console.error("[BlogGenerator] Erro Abacus.AI:", errText);
        lastLlmError = `Abacus.AI Error: ${response.status} - ${errText}`;
      }
    } catch (err: any) {
      console.error("[BlogGenerator] Falha requisição Abacus.AI:", err.message);
      lastLlmError = `Abacus.AI Request Failure: ${err.message}`;
    }
  }

  // 4. FALLBACK RICO LOCAL (Se nenhuma chave estiver configurada ou todas falharem)
  console.log(`[BlogGenerator] Usando fallback rico local.`);
  
  let nextIndex = 0;
  try {
    const existingPosts = await db.select({ id: blogPosts.id }).from(blogPosts);
    nextIndex = existingPosts.length % RICH_FALLBACK_ARTICLES.length;
  } catch (err) {
    console.error("[BlogGenerator] Falha ao ler banco para rotação de fallback:", err);
  }

  const fallback = RICH_FALLBACK_ARTICLES[nextIndex];
  const slug = fallback.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  return {
    title: fallback.title,
    slug,
    content: fallback.content,
    metaDescription: fallback.metaDescription,
    imagePrompt: "" // Fallback uses old getPerfectImageForTitle
  };
}

function getPerfectImageForTitle(title: string): string {
  const encodedPrompt = encodeURIComponent(`Luxurious high-end romantic lifestyle, ${title}, photorealistic, ultra detailed, 8k`);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=400&nologo=true`;
}

export async function runDailyBlogCron(source: 'ai_auto' | 'ai_manual' = 'ai_auto') {
  console.log('[BlogGenerator] Iniciando rotina diária de geração de conteúdo SEO...');
  try {
    const article = await generateBlogArticle();
    
    // Evita slugs duplicados
    const uniqueSlug = `${article.slug}-${crypto.randomBytes(3).toString('hex')}`;

    let content = article.content;
    let perfectImageUrl = "";
    
    // Se a IA gerou um imagePrompt, usamos a pollinations.ai
    if (article.imagePrompt) {
      const encodedPrompt = encodeURIComponent(article.imagePrompt);
      perfectImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=400&nologo=true`;
      console.log(`[BlogGenerator] Usando IA geradora de imagem para prompt: ${article.imagePrompt}`);
    } else {
      perfectImageUrl = getPerfectImageForTitle(article.title);
    }
    
    // Sobrescreve a imagem do conteúdo ou injeta uma perfeita no início do HTML!
    if (content.includes('<img')) {
      console.log('[BlogGenerator] Ajustando imagem do conteúdo para contexto ideal...');
      content = content.replace(/<img[^>]+src=["']([^"']+)["']/i, `<img src="${perfectImageUrl}"`);
    } else {
      console.log('[BlogGenerator] Artigo gerado sem imagem no HTML. Injetando imagem representativa...');
      const imgTag = `<img src="${perfectImageUrl}" alt="${article.title}" class="w-full rounded-2xl mb-6 shadow-md object-cover max-h-[400px]" />\n`;
      content = imgTag + content;
    }

    await db.insert(blogPosts).values({
      title: article.title,
      slug: uniqueSlug,
      content: content,
      metaDescription: article.metaDescription,
      source: source,
    });

    console.log(`[BlogGenerator] Artigo "${article.title}" gerado e salvo com sucesso (Fonte: ${source})!`);
  } catch (error) {
    console.error('[BlogGenerator] Falha ao gerar artigo:', error);
    throw error; // Re-lança o erro para que a requisição POST não retorne sucesso falsamente!
  }
}
