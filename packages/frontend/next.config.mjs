/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router já está ativado por padrão no Next.js 13+
  // Geração de sitemap e robots via next-sitemap (configurado separadamente)
  
  // Configuração de imagens — MinIO local + placeholders dev
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.sweetaffinity.com',
        pathname: '/**',
      },
      // Placeholders para desenvolvimento
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Variáveis de ambiente públicas expostas ao browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_APP_NAME: 'Sweet Affinity',
  },

  // Headers de segurança (reforçam o Helmet do backend)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
