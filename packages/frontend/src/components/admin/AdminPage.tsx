import React, { useState } from 'react';
import AdminUserRow from './AdminUserRow';
import type { AdminUser } from '../../types';

const mockUsers: AdminUser[] = [
    { id: 101, name: 'Carlos Andrade', email: 'carlos.new@email.com', submittedAt: '2024-07-29T10:00:00Z', status: 'Pending' },
    { id: 102, name: 'Sofia Pereira', email: 'sofia.sugar@email.com', submittedAt: '2024-07-29T11:30:00Z', status: 'Pending' },
    { id: 103, name: 'Miguel Costa', email: 'miguel.c@email.com', submittedAt: '2024-07-28T15:00:00Z', status: 'Approved' },
    { id: 104, name: 'Laura Martins', email: 'laura.m@email.com', submittedAt: '2024-07-27T09:00:00Z', status: 'Rejected' },
];

interface AdminPageProps {
    onApproveUser: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onApproveUser }) => {
    const [users, setUsers] = useState<AdminUser[]>(mockUsers);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

    const handleUpdateUserStatus = (userId: number, newStatus: 'Approved' | 'Rejected' | 'Deleted') => {
        if (newStatus === 'Deleted') {
            setUsers(users.filter(user => user.id !== userId));
        } else {
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: newStatus } : user
            ));
            // In this simulation, approving any user will trigger the login flow for the demo user in App.tsx
            if (newStatus === 'Approved') {
                onApproveUser();
            }
        }
    };
    
    const filteredUsers = users.filter(user => filter === 'All' || user.status === filter);
    const pendingCount = users.filter(user => user.status === 'Pending').length;

    return (
        <section className="py-12 bg-neutral-gray min-h-screen">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-bold mb-8 font-display text-gray-800">Painel Administrativo</h1>
                
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-2xl font-semibold font-display">Gerenciamento de Usuários</h2>
                        <div className="flex space-x-2">
                             {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 relative ${
                                        filter === f 
                                        ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white' 
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {f}
                                    {f === 'Pending' && pendingCount > 0 && (
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
                                    <th scope="col" className="px-6 py-3">Data de Envio</th>
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
                                Nenhum usuário encontrado para este filtro.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdminPage;
