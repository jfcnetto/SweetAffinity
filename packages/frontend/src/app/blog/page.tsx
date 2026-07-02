'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Simulação enquanto a rota da API não está pronta
const mockPosts = [
  { slug: 'como-evitar-golpes', title: 'Como Evitar Golpes no Mundo Sugar', excerpt: 'Dicas de segurança para Sugar Babies e Sugar Daddies.', publishedAt: '2026-07-01T10:00:00Z' },
  { slug: 'dicas-de-viagens-para-casais', title: 'Destinos Inesquecíveis para Casais', excerpt: 'Os melhores lugares para viajar com seu Sugar Daddy.', publishedAt: '2026-06-25T14:30:00Z' },
  { slug: 'presentes-dia-dos-namorados', title: 'Presentes Perfeitos para o Dia dos Namorados', excerpt: 'O que dar para quem já tem de tudo?', publishedAt: '2026-06-10T09:15:00Z' },
];

export default function BlogList() {
  const [posts, setPosts] = useState(mockPosts);

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold font-display text-gray-800 mb-8 text-center">Blog Sweet Affinity</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="group cursor-pointer">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gray-200 w-full object-cover">
                {/* Simulação de Imagem */}
                <div className="w-full h-full bg-gradient-to-tr from-pink-300 to-orange-200"></div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-400 mb-2">{new Date(post.publishedAt).toLocaleDateString('pt-BR')}</p>
                <h2 className="text-xl font-bold mb-3 group-hover:text-gradient-pink transition-colors">{post.title}</h2>
                <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
