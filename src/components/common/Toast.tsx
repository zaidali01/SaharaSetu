import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-xl p-4 shadow-elevated border flex items-start gap-3 backdrop-blur-md ${
                isSuccess
                  ? 'bg-emerald-950/90 text-emerald-50 border-emerald-500/40'
                  : isError
                  ? 'bg-rose-950/95 text-rose-50 border-rose-500/50 ring-2 ring-rose-500/30'
                  : isWarning
                  ? 'bg-amber-950/90 text-amber-50 border-amber-500/40'
                  : 'bg-slate-900/90 text-slate-50 border-slate-700/50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-teal-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-semibold text-sm leading-tight text-white">{toast.title}</h4>
                <p className="text-xs mt-1 text-slate-200 leading-relaxed font-normal">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
