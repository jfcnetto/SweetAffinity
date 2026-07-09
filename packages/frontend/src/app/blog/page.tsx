'use client';

import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  metaDescription: string;
  publishedAt: string;
}

const BLOG_IMAGES = [
  "https://image.pollinations.ai/prompt/romantic%20dinner%20for%20two%20luxury%20lifestyle?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/beautiful%20beach%20resort%20maldives%20luxury%20couple?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/luxury%20mansion%20balcony%20view?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/two%20champagne%20glasses%20luxury%20date?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/luxury%20lifestyle%20wealth%20romance?width=600&height=400&nologo=true"
];

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get(`/blog?nocache=${Date.now()}`);
        setPosts(response.data);
      } catch (err) {
        console.error('Erro ao buscar posts do blog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-extrabold font-display text-gray-900 dark:text-white mb-8 text-center">
          Blog Sweet Affinity
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            Nenhum artigo publicado no momento. Volte mais tarde!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => {
              const imgMatch = post.content ? post.content.match(/<img[^>]+src="([^">]+)"/) : null;
              const imageUrl = imgMatch ? imgMatch[1] : BLOG_IMAGES[idx % BLOG_IMAGES.length];
              return (
                <a 
                  href={`/blog/${post.slug}`} 
                  key={post.slug} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group cursor-pointer flex flex-col justify-between h-full bg-white dark:bg-slate-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition duration-300"
                >
                  <div>
                    <div className="h-48 bg-gray-200 w-full object-cover overflow-hidden relative">
                      <img 
                        src={imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-gray-450 dark:text-gray-400 mb-2">
                        {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                      </p>
                      <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {post.metaDescription}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-2">
                    <span className="text-xs font-bold text-red-600 group-hover:text-red-750 transition flex items-center gap-1">
                      Ler artigo completo &rarr;
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
