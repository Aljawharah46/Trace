import React from 'react';
import { useIncident } from '../../context/IncidentContext';
import { AlertTriangle, CheckCircle2, Info, AlertOctagon, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useIncident();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isCritical = toast.type === 'critical';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border transition-all duration-300 transform translate-y-0 shadow-2xl backdrop-blur-md flex items-start gap-3 ${
              isCritical
                ? 'bg-[#180B0F]/90 border-red-500/50 shadow-glow-red text-red-100'
                : isSuccess
                ? 'bg-[#0B1A14]/90 border-emerald-500/50 shadow-glow-emerald text-emerald-100'
                : isWarning
                ? 'bg-[#1C160B]/90 border-amber-500/50 text-amber-100'
                : 'bg-[#0E1726]/90 border-cyan-500/40 shadow-glow-cyan text-cyan-100'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isCritical && <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono opacity-90">
                  {toast.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
