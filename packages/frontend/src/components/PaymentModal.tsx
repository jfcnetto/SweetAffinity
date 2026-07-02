import React, { useState } from 'react';
import type { Plan } from '../types';
import { PaymentService } from '../services/payment.service.js';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.js';

interface PaymentModalProps {
    plan: Plan;
    onClose: () => void;
    onPaymentSuccess: () => void;
}

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full border-t-2 border-r-2 border-white ${size}`}></div>
);

const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, onPaymentSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { fetchUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
           const intent = await PaymentService.createIntent(plan.name.toLowerCase() === 'vip' ? 'premium' : 'premium_plus');
           await PaymentService.confirmPayment(intent.paymentIntentId);
           
           await fetchUser();
           setIsSuccess(true);
        } catch (error: any) {
           toast.error(error.response?.data?.message || 'Erro ao processar pagamento.');
        } finally {
           setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full relative transform transition-all animate-fade-in-down flex flex-col items-center text-center">
                    <CheckCircleIcon />
                    <h2 className="text-2xl font-bold text-center my-4 font-display">Pagamento Aprovado!</h2>
                    <p className="text-gray-600 mb-6">
                        Parabéns! Você agora é um membro {plan.name}. Explore todos os benefícios exclusivos.
                    </p>
                    <button onClick={onPaymentSuccess} className="w-full bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all">
                        Começar a usar
                    </button>
                </div>
            </div>
        );
    }
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full relative transform transition-all animate-fade-in-down">
                <button onClick={onClose} disabled={isProcessing} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-2xl font-bold text-center mb-2 font-display">Confirmar Assinatura</h2>
                <p className="text-center text-gray-600 mb-6">Você está assinando o plano <span className="font-bold text-gradient-pink">{plan.name}</span>.</p>

                <div className="bg-neutral-gray p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Total a pagar:</span>
                        <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Número do Cartão</label>
                            <input type="text" id="card-number" required placeholder="0000 0000 0000 0000" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-gray-900 placeholder-gray-500" />
                        </div>
                        <div>
                            <label htmlFor="card-holder" className="block text-sm font-medium text-gray-700">Nome no Cartão</label>
                            <input type="text" id="card-holder" required placeholder="Seu Nome Completo" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-gray-900 placeholder-gray-500" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700">Validade</label>
                                <input type="text" id="expiry-date" required placeholder="MM/AA" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-gray-900 placeholder-gray-500" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                                <input type="text" id="cvc" required placeholder="123" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-gray-900 placeholder-gray-500" />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full mt-8 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isProcessing ? <Spinner /> : `Pagar ${plan.price}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;