"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, { icon: string; className: string }> = {
  success: { icon: "✓", className: "border-[#68AB48] bg-[#F0FDF4] text-[#27743A]" },
  error: { icon: "!", className: "border-[#B42318] bg-[#FEF3F2] text-[#B42318]" },
  info: { icon: "i", className: "border-[#20639B] bg-[#EFF6FF] text-[#173F5F]" },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const style = toastStyles[toast.type];

  useEffect(() => {
    const timer = window.setTimeout(() => onClose(toast.id), 4200);
    return () => window.clearTimeout(timer);
  }, [onClose, toast.id]);

  return (
    <div className={`pointer-events-auto relative flex items-start gap-3 rounded-[18px] border-2 px-4 py-3 shadow-[5px_5px_0_#173F5F] animate-[toast-in_.35s_ease-out] ${style.className}`} role="status">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-current text-[15px] font-black">{style.icon}</span>
      <p className="flex-1 pt-1 text-[13px] font-black leading-[1.7]">{toast.message}</p>
      <button aria-label="إغلاق التنبيه" className="rounded-full px-2 py-1 text-[18px] font-black leading-none opacity-60 transition hover:bg-black/5 hover:opacity-100" onClick={() => onClose(toast.id)} type="button">×</button>
      <span className="absolute bottom-0 right-0 h-1 w-full origin-right rounded-full bg-current/30" />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const closeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((current) => [...current.slice(-2), { ...toast, id: Date.now() + Math.random() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex justify-center px-4" dir="rtl">
        <div className="flex w-full max-w-[430px] flex-col gap-3">
          {toasts.map((toast) => <ToastItem key={toast.id} onClose={closeToast} toast={toast} />)}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
