import {
  createRouter,
  createWebHistory,
  type Router,
  type RouteLocationNormalized
} from 'vue-router';

import { routes } from './routes';
import { useAuthStore } from '../store/auth';
import type { UserRole } from './meta';

const router: Router = createRouter({
  history: createWebHistory(),
  routes
});

const getUserRole = (): UserRole => {
  return 'admin';
};

router.beforeEach((to: RouteLocationNormalized) => {
  const authStore = useAuthStore();

  // 1. Неавторизован → только /auth
  if (!authStore.isAuth() && to.name !== 'auth') {
    return { name: 'auth' };
  }

  // 2. Авторизован → нельзя /auth
  if (authStore.isAuth() && to.name === 'auth') {
    return { name: 'home' };
  }

  // 3. Проверка ролей
  if (to.meta.roles && !to.meta.roles.includes(getUserRole())) {
    return { name: 'not-found' };
  }

  return true;
});

export default router;
