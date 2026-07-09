'use client';
import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import FeaturedProfiles from '../components/FeaturedProfiles';
import HowItWorks from '../components/HowItWorks';
import SocialProof from '../components/SocialProof';
import AuthModal from '../components/AuthModal';
import AdvancedSearch from '../components/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

const BLOG_IMAGES = [
  "https://image.pollinations.ai/prompt/romantic%20dinner%20for%20two%20luxury%20lifestyle?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/beautiful%20beach%20resort%20maldives%20luxury%20couple?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/luxury%20mansion%20balcony%20view?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/two%20champagne%20glasses%20luxury%20date?width=600&height=400&nologo=true",
  "https://image.pollinations.ai/prompt/luxury%20lifestyle%20wealth%20romance?width=600&height=400&nologo=true"
];

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('sweet_access_token');
      if (token && isAuthenticated) {
        // Serializa filtros como query params
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
          if (val) params.append(key, String(val));
        });

        const response = await api.get(`/profiles?${params.toString()}`);
        
        const mapped = response.data.map((p: any) => ({
          id: p.id,
          display_name: p.displayName,
          gender: p.gender,
          city: p.city,
          state: p.state,
          relationship_type: p.relationshipType,
          popularity_score: p.popularityScore || 0,
          primary_photo_url: p.primaryPhotoUrl || null,
          updated_at: p.createdAt || new Date().toISOString(),
        }));
        setProfiles(mapped);
      } else {
        // Perfis mocks exibidos apenas para visitantes deslogados
        setProfiles([
          { id: '1', display_name: 'Clara', relationship_type: 'Baby', city: 'São Paulo', state: 'SP', popularity_score: 95, primary_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', updated_at: new Date().toISOString() },
          { id: '2', display_name: 'Marcelo', relationship_type: 'Daddy', city: 'Rio de Janeiro', state: 'RJ', popularity_score: 90, primary_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop', updated_at: new Date().toISOString() },
          { id: '3', display_name: 'Sofia', relationship_type: 'Baby', city: 'Belo Horizonte', state: 'MG', popularity_score: 85, primary_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop', updated_at: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error("Erro ao buscar perfis na Home:", error);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const response = await api.get(`/blog?nocache=${Date.now()}`);
      setPosts(response.data.slice(0, 3));
    } catch (err) {
      console.error("Erro ao buscar artigos para a Home:", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchBlogPosts();
  }, [isAuthenticated, filters]);

  const handleProfileClick = (profile: any) => {
    if (isAuthenticated) {
      router.push(`/profiles/${profile.id}`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <Hero onCtaClick={() => setIsAuthModalOpen(true)} />
      
      {isAuthenticated && (
        <AdvancedSearch
          onApplyFilters={(newFilters) => setFilters(newFilters)}
          onClearFilters={() => setFilters({})}
        />
      )}

      <FeaturedProfiles 
        sectionTitle="Conexões para Você" 
        profiles={profiles} 
        onProfileClick={handleProfileClick} 
      />
      <HowItWorks />
      <SocialProof />

      {/* Artigos Recentes do Blog — Exibido apenas para visitantes deslogados */}
      {!isAuthenticated && posts.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-gray-100 dark:border-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white bg-gradient-to-r from-gradient-pink to-gradient-orange bg-clip-text text-transparent w-fit mx-auto pb-1">
                Estilo de Vida & Dicas
              </h2>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Fique por dentro das últimas tendências, guias de etiqueta e dicas exclusivas do universo Sugar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {posts.map((post, idx) => {
                const imgMatch = post.content ? post.content.match(/<img[^>]+src="([^">]+)"/) : null;
                const imageUrl = imgMatch ? imgMatch[1] : BLOG_IMAGES[idx % BLOG_IMAGES.length];
                return (
                  <a 
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition duration-300 flex flex-col justify-between h-full group"
                  >
                    <div>
                      {/* Imagem no topo */}
                      <div className="h-44 w-full relative overflow-hidden bg-gray-100">
                        <img 
                          src={imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550"
                        />
                      </div>
                      {/* Conteúdo com título abaixo */}
                      <div className="p-6 space-y-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                          {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-550 dark:text-gray-450 line-clamp-3 leading-relaxed">
                          {post.metaDescription}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 pt-2">
                      <span className="text-xs font-bold text-red-600 group-hover:text-red-750 transition flex items-center gap-1">
                        Ler Artigo &rarr;
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode="register" 
          onRegistrationComplete={() => setIsAuthModalOpen(false)}
          onLoginSuccess={() => {
            setIsAuthModalOpen(false);
            router.push('/');
          }}
          navigateTo={() => {}}
        />
      )}
    </>
  );
}
