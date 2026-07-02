import { Metadata } from 'next';
import Link from 'next/link';

interface BlogPostProps {
  params: { slug: string };
}

// Em Next.js 13+, fetch data server-side
async function getPostData(slug: string) {
  // Simulando fetch. Depois integraremos ao Fastify Backend ou DB local
  return {
    title: slug.split('-').join(' ').toUpperCase(),
    metaDescription: `Descrição SEO otimizada para o artigo ${slug}.`,
    content: `<p>Este é o conteúdo principal do artigo <strong>${slug}</strong>.</p><p>Gerado por IA com foco em SEO e Growth, abordando experiências, prevenção a golpes e estilo de vida.</p>`,
    publishedAt: new Date().toISOString()
  };
}

// Gera Meta tags (Title, Description, OpenGraph) dinâmicas para SEO (Growth)
export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const post = await getPostData(params.slug);
  return {
    title: `${post.title} | Blog Sweet Affinity`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.publishedAt,
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const post = await getPostData(params.slug);

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      <Link href="/blog" className="text-pink-500 hover:underline mb-6 inline-block">
        &larr; Voltar para o Blog
      </Link>
      
      <article className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold font-display text-gray-900 mb-4">{post.title}</h1>
        <p className="text-gray-400 text-sm mb-8 border-b pb-4">
          Publicado em: {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
        </p>
        
        <div 
          className="prose prose-pink lg:prose-lg text-gray-700" 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>
    </div>
  );
}
