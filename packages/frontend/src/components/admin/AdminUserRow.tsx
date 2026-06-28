import React from 'react';
import type { AdminUser, UserStatus } from '../../types';

interface AdminUserRowProps {
    user: AdminUser;
    onUpdateStatus: (userId: number, newStatus: 'Approved' | 'Rejected' | 'Deleted') => void;
}

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full inline-block";
    const statusClasses = {
        Pending: "bg-amber-100 text-amber-800",
        Approved: "bg-green-100 text-green-800",
        Rejected: "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const AdminUserRow: React.FC<AdminUserRowProps> = ({ user, onUpdateStatus }) => {
    
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(user.submittedAt));

    return (
        <tr className="bg-white border-b hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
            <td className="px-6 py-4">{user.email}</td>
            <td className="px-6 py-4">{formattedDate}</td>
            <td className="px-6 py-4">
                <StatusBadge status={user.status} />
            </td>
            <td className="px-6 py-4 text-center">
                {user.status === 'Pending' && (
                    <div className="flex justify-center items-center space-x-2">
                        <button onClick={() => onUpdateStatus(user.id, 'Approved')} className="font-medium text-green-600 hover:underline text-xs">Aprovar</button>
                        <button onClick={() => onUpdateStatus(user.id, 'Rejected')} className="font-medium text-red-600 hover:underline text-xs">Rejeitar</button>
                    </div>
                )}
                {user.status !== 'Pending' && (
                     <button onClick={() => onUpdateStatus(user.id, 'Deleted')} className="font-medium text-gray-500 hover:underline text-xs">Excluir</button>
                )}
            </td>
        </tr>
    );
};

export default AdminUserRow;
