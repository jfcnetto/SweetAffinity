import React from 'react';

const HourglassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-amber-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PendingVerification: React.FC = () => {
    return (
        <section className="py-20 bg-neutral-gray min-h-[70vh] flex items-center justify-center">
            <div className="container mx-auto px-6 max-w-2xl text-center bg-white p-12 rounded-lg shadow-lg">
                <HourglassIcon />
                <h2 className="text-4xl font-bold mb-4 font-display text-gray-800">Seu Cadastro está em Análise</h2>
                <p className="text-gray-600 text-lg mb-8">
                    Obrigado por se cadastrar! Para garantir a segurança e a qualidade da nossa comunidade, nossa equipe está revisando suas informações e documentos.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-md rounded-lg p-4">
                    Este processo é manual e pode levar <strong>até 48 horas</strong>. Você receberá uma notificação por e-mail assim que seu perfil for aprovado. Agradecemos a sua paciência.
                </div>
            </div>
        </section>
    );
};

export default PendingVerification;
