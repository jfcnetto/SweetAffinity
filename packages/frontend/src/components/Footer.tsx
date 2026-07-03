import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-gray-300">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white font-display mb-4">Sweet Affinity</h3>
            <p className="pr-8">A plataforma líder no Brasil para relacionamentos Sugar autênticos e seguros.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-gradient-pink">Sobre Nós</Link></li>
              <li><Link href="/blog" className="hover:text-gradient-pink">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-gradient-pink">FAQ</Link></li>
              <li><Link href="/plans" className="hover:text-gradient-pink">Planos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-gradient-pink">Termos de Uso</Link></li>
              <li><Link href="/privacy" className="hover:text-gradient-pink">Política de Privacidade</Link></li>
              <li><Link href="/security" className="hover:text-gradient-pink">Política de Segurança</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Sweet Affinity. Todos os direitos reservados.</p>
          <p className="mt-2 text-xs text-gray-500">Esta plataforma é destinada a maiores de 18 anos. Promovemos relacionamentos consensuais e proibimos qualquer forma de atividade ilegal.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
