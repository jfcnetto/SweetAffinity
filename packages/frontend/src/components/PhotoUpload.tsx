import React, { useState, useRef, useCallback } from 'react';

interface PhotoUploadProps {
  onComplete: () => void;
}

const MAX_PHOTOS = 20;

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onComplete }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (photos.length + newPhotos.length >= MAX_PHOTOS) break;
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newPhotos.push(URL.createObjectURL(file));
      }
    }
    setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [photos]);

  const removePhoto = (indexToRemove: number) => {
    const photoUrl = photos[indexToRemove];
    URL.revokeObjectURL(photoUrl); // Clean up memory
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  return (
    <section className="py-20 bg-neutral-gray min-h-screen">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-4 font-display text-gray-800">Quase lá! Adicione suas fotos</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Perfis com fotos de alta qualidade recebem 10x mais atenção. Adicione até 20 fotos. A primeira será a sua foto de perfil.
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-10 cursor-pointer transition-all duration-300 ${isDragging ? 'border-gradient-pink bg-gradient-pink/10' : 'border-gray-300 hover:border-gray-400'}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            multiple
            accept="image/*"
            className="hidden"
            disabled={photos.length >= MAX_PHOTOS}
          />
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="font-semibold">Arraste e solte suas fotos aqui</p>
            <p className="text-sm">ou clique para selecionar</p>
            <p className="text-xs mt-2 text-gray-400">{photos.length} de {MAX_PHOTOS} fotos adicionadas</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-8">
          {Array.from({ length: MAX_PHOTOS }).map((_, index) => (
            <div key={index} className="aspect-square bg-white border rounded-lg flex items-center justify-center relative overflow-hidden group">
              {photos[index] ? (
                <>
                  <img src={photos[index]} alt={`Upload preview ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removePhoto(index)} className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-xs font-bold px-2 py-1 rounded">
                      Perfil
                    </div>
                  )}
                </>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <button
            onClick={onComplete}
            disabled={photos.length === 0}
            className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-bold px-12 py-4 rounded-full text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            Concluir Cadastro
          </button>
        </div>
      </div>
    </section>
  );
};

export default PhotoUpload;
