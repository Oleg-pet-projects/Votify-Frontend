import 'vue-router';

export type UserRole = 'user' | 'admin';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: UserRole[];
  }
}
