import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiplas requisições de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor para injetar o accessToken
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sweet_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para refresh token automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 e não for na rota de refresh
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('sweet_refresh_token');
      if (!refreshToken) {
        // Se não tem refresh token, força logout e redireciona (a lógica de logout ficará no contexto, mas aqui limpamos o storage)
        localStorage.removeItem('sweet_access_token');
        localStorage.removeItem('sweet_refresh_token');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('http://localhost:4000/auth/refresh', {
          refreshToken
        });

        const newAccessToken = data.accessToken;
        localStorage.setItem('sweet_access_token', newAccessToken);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('sweet_access_token');
        localStorage.removeItem('sweet_refresh_token');
        window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
