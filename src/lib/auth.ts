'use client';

export const APP_PIN = process.env.NEXT_PUBLIC_APP_PIN || '1234';

export const isAuthenticated = (): boolean => {
  return typeof window !== 'undefined' && localStorage.getItem('milky-auth') === 'true';
};

export const requireAuth = (): boolean => isAuthenticated();

export const signIn = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('milky-auth', 'true');
  }
};

export const signOut = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('milky-auth');
  }
};
