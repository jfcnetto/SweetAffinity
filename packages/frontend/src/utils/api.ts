const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sweetaffinity-backend.onrender.com';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('sweet_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.message || 'Erro de comunicação com o servidor.';
    const detailMsg = errorData.details || errorData.error || '';
    throw new Error(detailMsg ? `${errMsg} - Detalhes: ${detailMsg}` : errMsg);
  }

  return response.json();
};