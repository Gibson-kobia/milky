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

// Date utilities
export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getYesterdayString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const isToday = (dateString: string) => {
  return dateString === getTodayString();
};

export const isWithin24Hours = (dateString: string) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diff24h = 24 * 60 * 60 * 1000;
  return diffMs < diff24h && diffMs >= 0;
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
  if (litres <= 0) return false;
  const remainder = litres % 1;
  return remainder === 0 || remainder === 0.5;
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
