'use client';

export const APP_PIN = process.env.NEXT_PUBLIC_APP_PIN || '1234';

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const key = String('milky-auth') || '';
  return localStorage.getItem(key) === 'true';
};

export const requireAuth = (): boolean => isAuthenticated();

export const signIn = () => {
  if (typeof window !== 'undefined') {
    const key = String('milky-auth') || '';
    localStorage.setItem(key, 'true');
  }
};

export const signOut = () => {
  if (typeof window !== 'undefined') {
    const key = String('milky-auth') || '';
    localStorage.removeItem(key);
  }
};
