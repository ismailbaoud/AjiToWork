export const ROUTES = {
  HOME: '/',
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  }
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
