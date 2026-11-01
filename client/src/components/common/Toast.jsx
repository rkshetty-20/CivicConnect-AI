import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />,
  notification: <Bell className="w-5 h-5 text-teal-400 flex-shrink-0" />,
};

const STYLES = {
  success: 'border-emerald-500/20 bg-emerald-500/10',
  error: 'border-rose-500/20 bg-rose-500/10',
  info: 'border-sky-500/20 bg-sky-500/10',
  notification: 'border-teal-500/20 bg-teal-500/10',
};

// Global toast state (module-level so non-React code can call it)
let addToastFn = null;

export const toast = {
  success: (msg) => addToastFn?.({ type: 'success', message: msg }),
  error: (msg) => addToastFn?.({ type: 'error', message: msg }),
  info: (msg) => addToastFn?.({ type: 'info', message: msg }),
  notification: (msg) => addToastFn?.({ type: 'notification', message: msg }),
};

function ToastItem({ id, type, message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4500);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`flex items-start space-x-3 px-4 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-sm text-slate-200 max-w-sm w-full animate-slide-in ${STYLES[type] || STYLES.info}`}
    >
      {ICONS[type] || ICONS.info}
      <p className="flex-1 leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-slate-500 hover:text-slate-300 transition flex-shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  // Register the global adder
  useEffect(() => {
    addToastFn = ({ type, message }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    };
    return () => { addToastFn = null; };
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
