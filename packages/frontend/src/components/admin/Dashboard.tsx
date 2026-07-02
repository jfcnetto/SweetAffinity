import React, { useEffect, useState } from 'react';
import { adminService, AdminDashboardData } from '../../services/admin.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const Dashboard: React.FC = () => {
    const [data, setData] = useState<AdminDashboardData | null>(null);

    useEffect(() => {
        adminService.getDashboardData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="text-center py-10">Carregando métricas...</div>;

    // Dados mockados para gerar um gráfico de MRR dos últimos meses
    const mrrData = [
        { name: 'Jan', MRR: data.mrr * 0.5 },
        { name: 'Fev', MRR: data.mrr * 0.7 },
        { name: 'Mar', MRR: data.mrr * 0.9 },
        { name: 'Abr', MRR: data.mrr }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-gray-500 font-semibold mb-2">MRR (Mensal)</h3>
                    <p className="text-3xl font-bold text-gray-800">
                        R$ {data.mrr.toFixed(2).replace('.', ',')}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-gray-500 font-semibold mb-2">ARR (Anual)</h3>
                    <p className="text-3xl font-bold text-gray-800">
                        R$ {data.arr.toFixed(2).replace('.', ',')}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-gray-500 font-semibold mb-2">Assinaturas Ativas</h3>
                    <p className="text-3xl font-bold text-gray-800">{data.activeSubscriptions}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-gray-500 font-semibold mb-2">Total de Usuários (Ativos)</h3>
                    <p className="text-3xl font-bold text-gray-800">{data.totalActiveUsers}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg h-96">
                    <h3 className="text-lg font-bold mb-4">Crescimento de MRR</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mrrData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="MRR" fill="#ff4b8b" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg h-96">
                    <h3 className="text-lg font-bold mb-4">Métricas de Engajamento</h3>
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500 mb-2">Total de Matches Realizados</p>
                        <p className="text-6xl font-display text-transparent bg-clip-text bg-gradient-to-r from-gradient-pink to-gradient-orange">
                            {data.totalMatches}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
