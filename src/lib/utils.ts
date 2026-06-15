// Formatting utilities
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatLitres = (litres: number) => {
  return `${litres.toLocaleString('en-KE')} L`;
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatMonthYear = (year: number, month: number) => {
  const date = new Date(year, month - 1);
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
  }).format(date);
};

import { format, addDays, parseISO, isValid } from 'date-fns';

// Date utilities
export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getTodayString = getCurrentDate;

export const getDateOffsetString = (dateString: string, offset: number) => {
  const base = parseISO(dateString);
  if (!isValid(base)) return dateString;
  const next = addDays(base, offset);
  return format(next, 'yyyy-MM-dd');
};

export const formatDisplayDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'd MMM yyyy');
};

export const formatDateHeading = (dateString: string) => {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'dd MMMM yyyy');
};

export const formatShortDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'd MMM');
};

export const isToday = (dateString: string) => {
  return dateString === getTodayString();
};

export const isValidIsoDate = (dateString: string) => {
  const date = parseISO(dateString);
  return isValid(date) && format(date, 'yyyy-MM-dd') === dateString;
};

export const isWithin24Hours = (dateString: string) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diff24h = 24 * 60 * 60 * 1000;
  return diffMs < diff24h && diffMs >= 0;
};

// Month utilities
export const getMonthStartString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const getMonthStartForDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (!isValid(date)) return getMonthStartString();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
};

export const getDaysInCurrentMonth = (): string[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthEnd = new Date(year, month, 0);
  
  const days: string[] = [];
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = date.toISOString().split('T')[0];
    // Only include days up to today
    if (dateStr <= getTodayString()) {
      days.push(dateStr);
    }
  }
  return days;
};

// Calculation utilities
export const calculateMilkValue = (litres: number, ratePerLitre: number) => {
  return litres * ratePerLitre;
};

export const calculateProfit = (
  totalLitres: number,
  buyingRate: number,
  sellingRate: number
) => {
  return totalLitres * (sellingRate - buyingRate);
};

export const calculateDailyProfit = (totalLitres: number) => {
  const BUYING_RATE = parseFloat(
    process.env.NEXT_PUBLIC_BUYING_RATE || '55'
  );
  const SELLING_RATE = parseFloat(
    process.env.NEXT_PUBLIC_SELLING_RATE || '70'
  );
  return calculateProfit(totalLitres, BUYING_RATE, SELLING_RATE);
};

// Validation utilities
export const validatePhoneNumber = (phone: string): boolean => {
  const kenyaPhoneRegex = /^(?:\+254|0)[17][0-9]{8}$/;
  return kenyaPhoneRegex.test(phone);
};

export const validatePin = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

export const validateMilkQuantity = (litres: number): boolean => {
  if (typeof litres !== 'number' || isNaN(litres) || litres <= 0) return false;
  // Accept quarter-litre increments (0.25, 0.5, 0.75, 1.00, ...)
  // Multiply by 100 and ensure divisible by 25 to avoid floating point issues
  const scaled = Math.round(litres * 100);
  return scaled > 0 && scaled % 25 === 0;
};

// PIN hashing (basic - use bcrypt in production)
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (
  pin: string,
  hash: string
): Promise<boolean> => {
  const computed = await hashPin(pin);
  return computed === hash;
};

// Generate UUID-like string for offline operations
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
