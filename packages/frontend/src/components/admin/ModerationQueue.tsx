import React, { useEffect, useState } from 'react';
import { adminService, AdminPendingPhoto } from '../../services/admin.service';

const ModerationQueue: React.FC = () => {
    const [photos, setPhotos] = useState<AdminPendingPhoto[]>([]);

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const data = await adminService.getPendingPhotos();
            setPhotos(data);
        } catch (e) {
            console.error('Erro ao buscar fotos', e);
        }
    };

    const handleModerate = async (id: string, approved: boolean) => {
        try {
            await adminService.moderatePhoto(id, approved);
            setPhotos(photos.filter(p => p.id !== id));
        } catch (e) {
            alert('Erro ao moderar foto');
        }
    };

    if (photos.length === 0) {
        return (
            <div className="bg-white p-10 rounded-lg shadow-lg text-center">
                <h3 className="text-xl text-gray-500">Fila de moderação vazia. Bom trabalho! 🎉</h3>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold font-display mb-6 border-b pb-4">Fila de Moderação de Fotos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map(photo => (
                    <div key={photo.id} className="border rounded-lg overflow-hidden shadow-sm flex flex-col">
                        <img 
                            src={photo.url} 
                            alt={`Foto pendente de ${photo.display_name}`} 
                            className="w-full h-64 object-cover"
                        />
                        <div className="p-4 flex flex-col flex-grow">
                            <h4 className="font-bold text-lg mb-1">{photo.display_name}</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                {photo.is_primary ? 'Foto de Perfil Principal' : 'Foto Adicional'}
                                <br/>
                                Enviada em: {new Date(photo.created_at).toLocaleDateString()}
                            </p>
                            
                            <div className="mt-auto flex gap-3">
                                <button 
                                    onClick={() => handleModerate(photo.id, false)}
                                    className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition"
                                >
                                    Rejeitar
                                </button>
                                <button 
                                    onClick={() => handleModerate(photo.id, true)}
                                    className="flex-1 py-2 bg-green-100 text-green-600 rounded-lg font-semibold hover:bg-green-200 transition"
                                >
                                    Aprovar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModerationQueue;
