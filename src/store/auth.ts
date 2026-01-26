// src/store/auth.ts
import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { IAuthForm, ILoginPayload, IRegisterPayload, IUser } from '../types/auth';
import api from '../api';
import { useLocalStorage } from '@vueuse/core';

export const useAuthStore = defineStore('auth', () => {
  const form = reactive<IAuthForm>({
    login: '',
    password: '',
    email: ''
  });

  // access token хранится на клиенте (используется для Authorization header)
  const token = useLocalStorage<string | null>('token', null);

  const user = useLocalStorage<IUser | null>('me', null);

  const isAuth = (): boolean => {
    return Boolean(token.value);
  };

  function setToken(accessToken: string | null) {
    token.value = accessToken;
  }

  async function login(): Promise<void> {
    const payload: ILoginPayload = {
      login: form.login,
      password: form.password
    };

    const { data } = await api.post('/login', payload);
    // backend returns { accessToken } and sets refresh cookie
    const access = data && (data.accessToken ?? data.token ?? null);
    if (!access) throw new Error('No access token returned from /login');

    setToken(access);
    // optionally fetch user data
    try {
      const me = await fetchMe();
      user.value = me;
    } catch (_) {
      user.value = null;
    }
  }

  async function register(): Promise<void> {
    const payload: IRegisterPayload = {
      login: form.login,
      password: form.password,
      email: form.email!
    };

    const { data } = await api.post('/register', payload);
    const access = data && (data.accessToken ?? data.token ?? null);
    if (!access) throw new Error('No access token returned from /register');

    setToken(access);
    try {
      const me = await fetchMe();
      user.value = me;
    } catch (_) {
      user.value = null;
    }
  }

  // Logout: вызов на сервер, очистка локального состояния
  async function logout(): Promise<void> {
    try {
      await api.post('/logout'); // очистит refresh-cookie на бэке
    } catch (e) {
      // ignore
    } finally {
      clientLogout();
    }
  }

  // вручную очистить локальные данные (используется при failed refresh)
  function clientLogout(): void {
    setToken(null);
    user.value = null;
  }

  // получить /me
  async function fetchMe(): Promise<IUser> {
    const { data } = await api.get('/me');
    user.value = data;
    return data;
  }

  // init: при старте приложения можно попытаться обновить access-token по cookie
  // (если фронтенд загружается с уже установленной refresh cookie).
  async function init(): Promise<void> {
    if (isAuth()) return; // токен уже есть
    try {
      // запрос /refresh вернёт новый accessToken (если cookie валиден)
      const { data } = await api.post('/refresh', {});
      const access = data && (data.accessToken ?? data.token ?? null);
      if (access) {
        setToken(access);
        await fetchMe();
      }
    } catch (e) {
      // no-op
    }
  }

  return {
    form,
    token,
    user,
    isAuth,
    setToken,
    login,
    register,
    logout,
    clientLogout,
    fetchMe,
    init
  };
});
