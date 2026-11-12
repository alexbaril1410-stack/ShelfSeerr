import { useState, useCallback } from 'react';

import type { Toast } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const useToast = () => {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'error' = 'info',
      persistent: boolean = false,
    ): string => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message: t(message), type }]);

      if (!persistent) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
      }

      return id;
    },
    [t],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};
