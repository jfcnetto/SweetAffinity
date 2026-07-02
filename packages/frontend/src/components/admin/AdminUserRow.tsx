import React from 'react';
import type { AdminUser } from '../../services/admin.service';

interface AdminUserRowProps {
    user: AdminUser;
    onUpdateStatus: (userId: string, newStatus: 'active' | 'suspended' | 'banned') => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full inline-block";
    let statusClasses = "bg-gray-100 text-gray-800";
    
    if (status === 'active') statusClasses = "bg-green-100 text-green-800";
    if (status === 'pending') statusClasses = "bg-amber-100 text-amber-800";
    if (status === 'suspended') statusClasses = "bg-red-100 text-red-800";
    if (status === 'banned') statusClasses = "bg-gray-800 text-white";

    return <span className={`${baseClasses} ${statusClasses}`}>{status}</span>;
};

const AdminUserRow: React.FC<AdminUserRowProps> = ({ user, onUpdateStatus }) => {
    
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(user.createdAt));

    return (
        <tr className="bg-white border-b hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.displayName || 'Sem Nome'}</td>
            <td className="px-6 py-4">{user.email}</td>
            <td className="px-6 py-4">{formattedDate}</td>
            <td className="px-6 py-4">
                <StatusBadge status={user.status} />
            </td>
            <td className="px-6 py-4 text-center">
                {user.status !== 'active' && (
                    <button onClick={() => onUpdateStatus(user.id, 'active')} className="font-medium text-green-600 hover:underline text-xs mr-2">Ativar</button>
                )}
                {user.status !== 'suspended' && (
                    <button onClick={() => onUpdateStatus(user.id, 'suspended')} className="font-medium text-amber-600 hover:underline text-xs mr-2">Suspender</button>
                )}
                {user.status !== 'banned' && (
                    <button onClick={() => onUpdateStatus(user.id, 'banned')} className="font-medium text-red-600 hover:underline text-xs">Banir</button>
                )}
            </td>
        </tr>
    );
};

export default AdminUserRow;
