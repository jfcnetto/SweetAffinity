import React from 'react';

interface FooterProps {
  navigateTo: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
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
              <li><button onClick={() => navigateTo('about')} className="hover:text-gradient-pink">Sobre Nós</button></li>
              <li><button onClick={() => navigateTo('blog')} className="hover:text-gradient-pink">Blog</button></li>
              <li><button onClick={() => navigateTo('faq')} className="hover:text-gradient-pink">FAQ</button></li>
              <li><button onClick={() => navigateTo('plans')} className="hover:text-gradient-pink">Planos</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigateTo('terms')} className="hover:text-gradient-pink">Termos de Uso</button></li>
              <li><a href="#" className="hover:text-gradient-pink">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-gradient-pink">Política de Segurança</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Sweet Affinity. Todos os direitos reservados.
            <button onClick={() => navigateTo('admin-login')} className="hover:text-gradient-pink ml-4 opacity-50">(Admin Panel)</button>
          </p>
          <p className="mt-2">Esta plataforma é destinada a maiores de 18 anos. Promovemos relacionamentos consensuais e proibimos qualquer forma de atividade ilegal.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
