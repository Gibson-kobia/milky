'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 sm:gap-3 sm:p-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({
  toast,
  onRemove,
}: {
  toast: { id: string; type: string; message: string; duration?: number };
  onRemove: () => void;
}) {
  useEffect(() => {
    if (!toast.duration) return;

    const timer = setTimeout(onRemove, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-milk-green-600" />,
    warning: <AlertCircle className="h-5 w-5 text-milk-amber-600" />,
  };

  const bgColorMap = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-milk-green-50 border-milk-green-200',
    warning: 'bg-milk-amber-50 border-milk-amber-200',
  };

  const textColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-milk-green-800',
    warning: 'text-milk-amber-800',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, x: 100 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -10, x: 100 }}
      transition={{ duration: 0.2 }}
      className={`flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-md-soft ${
        bgColorMap[toast.type as keyof typeof bgColorMap]
      }`}
    >
      {iconMap[toast.type as keyof typeof iconMap]}
      <p
        className={`flex-1 text-sm font-medium ${
          textColorMap[toast.type as keyof typeof textColorMap]
        }`}
      >
        {toast.message}
      </p>
      <button
        onClick={onRemove}
        className="rounded p-0.5 hover:bg-white/30"
        aria-label="Close notification"
      >
        <X className="h-4 w-4 opacity-70" />
      </button>
    </motion.div>
  );
}
