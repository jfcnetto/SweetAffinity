import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import LayoutWrapper from '../components/LayoutWrapper';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Sweet Affinity - Relacionamentos Sugar de Alto Nível',
  description: 'Conecte-se com pessoas incríveis e desfrute do estilo de vida Sugar de alto nível. Segurança, privacidade e exclusividade.',
  openGraph: {
    title: 'Sweet Affinity - Relacionamentos Sugar de Alto Nível',
    description: 'Conecte-se com pessoas incríveis e desfrute do estilo de vida Sugar de alto nível. Segurança, privacidade e exclusividade.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Sweet Affinity',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="bg-neutral-gray text-dark-gray antialiased font-sans">
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
