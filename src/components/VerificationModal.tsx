import React, { useState, useRef, useEffect, useCallback } from 'react';

// Icons
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 019-2.611m3.076-5.357A12.026 12.026 0 0121 20.944a11.955 11.955 0 01-9 2.611m0 0a11.955 11.955 0 01-2.612-3.076m-2.098-5.36A12.026 12.026 0 013 20.944" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" /></svg>;
const HourglassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-pink"></div>;

interface VerificationModalProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'intro' | 'documentUpload' | 'selfieUpload' | 'processing' | 'pending';

const VerificationModal: React.FC<VerificationModalProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState<Step>('intro');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'selfie') => {
      const file = e.target.files?.[0];
      if (file) {
          const previewUrl = URL.createObjectURL(file);
          if (fileType === 'document') {
              setDocumentFile(file);
              setDocumentPreview(previewUrl);
          } else {
              setSelfieFile(file);
              setSelfiePreview(previewUrl);
          }
      }
  };

  const handleSubmitForReview = () => {
      setStep('processing');
      // Simulate API call for document submission
      setTimeout(() => {
          setStep('pending');
      }, 2500);
  };
  
  useEffect(() => {
      // Cleanup object URLs on unmount
      return () => {
          if (documentPreview) URL.revokeObjectURL(documentPreview);
          if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      };
  }, [documentPreview, selfiePreview]);

  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <>
            <ShieldIcon />
            <h2 className="text-3xl font-bold text-center my-4 font-display">Verifique seu Perfil</h2>
            <p className="text-gray-600 text-center mb-8">
              Para a segurança de todos, exigimos uma verificação de identidade em duas etapas. Isso garante que todos são quem dizem ser.
            </p>
            <button onClick={() => setStep('documentUpload')} className="w-full bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all">
                Iniciar Verificação
            </button>
          </>
        );
      case 'documentUpload':
        return (
             <>
                <DocumentIcon />
                <h2 className="text-2xl font-bold text-center my-4 font-display">Etapa 1: Foto do Documento</h2>
                <p className="text-gray-600 text-center mb-6">
                    Envie uma foto nítida de um documento oficial (RG, CNH ou Passaporte).
                </p>
                <input type="file" accept="image/*" ref={docInputRef} onChange={(e) => handleFileChange(e, 'document')} className="hidden" />
                <div onClick={() => docInputRef.current?.click()} className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-gradient-pink">
                    {documentPreview ? (
                        <img src={documentPreview} alt="Pré-visualização do documento" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center text-gray-500">
                           <UploadIcon />
                           <p>Clique para enviar</p>
                        </div>
                    )}
                </div>
                 <button onClick={() => setStep('selfieUpload')} disabled={!documentFile} className="w-full mt-6 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Continuar
                </button>
             </>
        );
      case 'selfieUpload':
         return (
             <>
                <DocumentIcon />
                <h2 className="text-2xl font-bold text-center my-4 font-display">Etapa 2: Selfie com Documento</h2>
                <p className="text-gray-600 text-center mb-6">
                    Agora, envie uma selfie sua segurando o mesmo documento que você enviou anteriormente.
                </p>
                <input type="file" accept="image/*" capture="user" ref={selfieInputRef} onChange={(e) => handleFileChange(e, 'selfie')} className="hidden" />
                <div onClick={() => selfieInputRef.current?.click()} className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-gradient-pink">
                    {selfiePreview ? (
                        <img src={selfiePreview} alt="Pré-visualização da selfie" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center text-gray-500">
                           <UploadIcon />
                           <p>Clique para enviar</p>
                        </div>
                    )}
                </div>
                 <button onClick={handleSubmitForReview} disabled={!selfieFile} className="w-full mt-6 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Enviar para Análise
                </button>
             </>
        );
      case 'processing':
        return (
          <>
            <Spinner />
            <h2 className="text-2xl font-bold text-center mt-6 font-display">Processando Envio...</h2>
            <p className="text-gray-600 text-center mt-2">Isso pode levar alguns segundos. Não feche esta janela.</p>
          </>
        );
      case 'pending':
        return (
          <>
            <HourglassIcon />
            <h2 className="text-3xl font-bold text-center my-4 font-display">Análise Pendente</h2>
            <p className="text-gray-600 text-center mb-8">
              Seus documentos foram enviados com sucesso! Nossa equipe irá revisar suas informações para garantir a segurança da comunidade. Este processo é manual e pode levar até 48 horas. Você receberá um e-mail quando seu perfil for aprovado.
            </p>
            <button onClick={onComplete} className="w-full bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 transition-all">
              Entendi, Voltar ao Início
            </button>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full relative transform transition-all animate-fade-in-down">
        {step !== 'processing' && step !== 'pending' && (
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        )}
        <div className="flex flex-col items-center justify-center">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;