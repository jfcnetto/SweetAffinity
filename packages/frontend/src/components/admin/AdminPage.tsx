import React, { useState, useEffect } from 'react';
import AdminUserRow from './AdminUserRow';
import { adminService, AdminUser } from '../../services/admin.service';
import Dashboard from './Dashboard';
import ModerationQueue from './ModerationQueue';

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'photos'>('dashboard');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended' | 'banned'>('all');

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab]);

    const loadUsers = async () => {
        try {
            const data = await adminService.getUsers(50);
            setUsers(data);
        } catch (e) {
            console.error('Erro ao buscar usuários', e);
        }
    };

    const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
        try {
            await adminService.updateUserStatus(userId, newStatus);
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: newStatus } : user
            ));
        } catch (e) {
            alert('Erro ao atualizar usuário');
        }
    };
    
    const filteredUsers = users.filter(user => filter === 'all' || user.status === filter);
    const pendingCount = users.filter(user => user.status === 'pending').length;

    return (
        <section className="py-12 bg-neutral-gray min-h-screen">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-bold mb-8 font-display text-gray-800">Painel Administrativo</h1>
                
                <div className="mb-6 flex space-x-4 border-b border-gray-300 pb-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')} 
                        className={`font-semibold pb-2 ${activeTab === 'dashboard' ? 'text-gradient-pink border-b-2 border-gradient-pink' : 'text-gray-500'}`}
                    >
                        Dashboard KPIs
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')} 
                        className={`font-semibold pb-2 ${activeTab === 'users' ? 'text-gradient-pink border-b-2 border-gradient-pink' : 'text-gray-500'}`}
                    >
                        Usuários
                    </button>
                    <button 
                        onClick={() => setActiveTab('photos')} 
                        className={`font-semibold pb-2 ${activeTab === 'photos' ? 'text-gradient-pink border-b-2 border-gradient-pink' : 'text-gray-500'}`}
                    >
                        Moderação de Fotos
                    </button>
                </div>

                {activeTab === 'dashboard' && <Dashboard />}

                {activeTab === 'photos' && <ModerationQueue />}

                {activeTab === 'users' && (
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-semibold font-display">Gerenciamento de Usuários</h2>
                            <div className="flex space-x-2">
                                 {(['all', 'pending', 'active', 'suspended', 'banned'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 relative capitalize ${
                                            filter === f 
                                            ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white' 
                                            : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {f}
                                        {f === 'pending' && pendingCount > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500 text-white text-xs items-center justify-center">{pendingCount}</span>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Nome</th>
                                        <th scope="col" className="px-6 py-3">Email</th>
                                        <th scope="col" className="px-6 py-3">Data de Cadastro</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <AdminUserRow 
                                            key={user.id} 
                                            user={user} 
                                            onUpdateStatus={handleUpdateUserStatus} 
                                        />
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    Nenhum usuário encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdminPage;
