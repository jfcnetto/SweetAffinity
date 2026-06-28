import React, { useState } from 'react';

interface AdminLoginProps {
    onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('admin@sweetaffinity.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Simulação de autenticação
        // Em um app real, aqui haveria uma chamada de API para validar as credenciais
        if (email === 'admin@sweetaffinity.com' && password === 'admin123') {
            onLoginSuccess();
        } else {
            setError('Credenciais inválidas. O acesso é restrito.');
        }
    };

    return (
        <section className="py-20 bg-neutral-gray min-h-[70vh] flex items-center justify-center">
            <div className="container mx-auto px-6 max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-2xl w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold font-display text-gray-800">Acesso Restrito</h2>
                        <p className="text-gray-600 mt-2">Autenticação para administradores.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                id="admin-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-gray-900 placeholder-gray-500 [color-scheme:light]"
                                placeholder="admin@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">Senha</label>
                            <input
                                type="password"
                                id="admin-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-gray-900 placeholder-gray-500 [color-scheme:light]"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
                        )}

                        <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-md">
                            <p><strong>Para fins de demonstração:</strong></p>
                            <p>Email: <code className="font-mono">admin@sweetaffinity.com</code></p>
                            <p>Senha: <code className="font-mono">admin123</code></p>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
                            >
                                Entrar no Painel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default AdminLogin;
