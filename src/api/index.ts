// src/api/index.ts
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/auth';

const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // важно — чтобы browser отправлял httpOnly cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Refresh queue — чтобы параллельные запросы не вызывали несколько /refresh.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: AxiosResponse) => void;
  reject: (err: any) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
      resolve(axios(config));
    }
  });
  failedQueue = [];
};

// Request interceptor — добавляем access token
api.interceptors.request.use(config => {
  try {
    const authStore = useAuthStore();
    const token = authStore.token as string | null;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // store не инициализирован — пропускаем
  }
  return config;
});

// Response interceptor — ловим 401 и пробуем refresh
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config!;
    const status = error.response?.status;

    // Если нет 401 — пробрасываем ошибку дальше
    if (status !== 401) {
      return Promise.reject(error);
    }

    // Если уже пытались обновить и этот запрос — /refresh — то logout
    if (originalRequest.url?.includes('/refresh')) {
      // обновление токена не удалось
      const authStore = useAuthStore();
      await authStore.clientLogout(); // очистим локально и на бэке
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // ставим в очередь — вернём промис, который выполнится после refresh
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    isRefreshing = true;

    try {
      // Вызов /refresh — cookie будет отправлена автоматически (withCredentials = true)
      const refreshResponse = await axios.post(
        `${BASE_URL}/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccess = (refreshResponse.data && refreshResponse.data.accessToken) || null;
      if (!newAccess) {
        throw new Error('No access token in refresh response');
      }

      // Сохраняем новый токен в store
      const authStore = useAuthStore();
      authStore.setToken(newAccess);

      // повторяем оригинальный запрос с новым токеном
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
      }

      processQueue(null, newAccess);
      return axios(originalRequest);
    } catch (err) {
      processQueue(err, null);
      const authStore = useAuthStore();
      await authStore.clientLogout(); // очистим состояние и позовём logout endpoint
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
