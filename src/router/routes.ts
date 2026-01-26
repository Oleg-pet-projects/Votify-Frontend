import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/pages/auth-page.vue')
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/home-page.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/admin-page.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/not-found',
    name: 'not-found',
    component: () => import('@/pages/not-found-page.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found'
  }
];
