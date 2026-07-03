import { api } from './api';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export const PaymentService = {
  createIntent: async (planId: string): Promise<PaymentIntentResponse> => {
    const { data } = await api.post<PaymentIntentResponse>('/payment/create-intent', { planId });
    return data;
  },

  confirmPayment: async (paymentIntentId: string): Promise<{ success: boolean }> => {
    const { data } = await api.post<{ success: boolean }>('/payment/confirm', { paymentIntentId });
    return data;
  }
};
