import { Metadata } from 'next';
import Link from 'next/link';

interface BlogPostProps {
  params: Promise<{ slug: string }> | { slug: string };
}

async function getPostData(slug: string) {
  try {
    const response = await fetch(`http://localhost:4000/blog/${slug}`, { 
      cache: 'no-store' 
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('Erro ao buscar artigo do blog:', err);
    return null;
  }
}

export async function generateMetadata(props: BlogPostProps): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostData(params.slug);
  if (!post) {
    return {
      title: 'Artigo Não Encontrado | Sweet Affinity',
    };
  }
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

export default async function BlogPostPage(props: BlogPostProps) {
  const params = await props.params;
  const post = await getPostData(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center items-center py-20 px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Artigo Não Encontrado</h1>
        <p className="text-gray-650 dark:text-gray-400 mb-6">O artigo que você procura não existe ou foi removido.</p>
        <Link href="/blog" className="text-red-600 hover:text-red-750 hover:underline font-semibold">
          &larr; Voltar para o Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="container mx-auto px-6 max-w-3xl">
        <Link href="/blog" className="text-red-600 hover:text-red-750 hover:underline mb-6 inline-block font-semibold">
          &larr; Voltar para o Blog
        </Link>
        
        <article className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-gray-800 p-8 rounded-2xl shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
          <p className="text-gray-450 dark:text-gray-550 text-xs mb-8 border-b dark:border-gray-800 pb-4">
            Publicado em: {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
          </p>
          
          <div 
            className="prose prose-red dark:prose-invert lg:prose-lg text-gray-700 dark:text-gray-300 leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </article>
      </div>
    </div>
  );
}
