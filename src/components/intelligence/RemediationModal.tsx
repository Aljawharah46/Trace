import React, { useEffect } from 'react';
import { useIncident } from '../../context/IncidentContext';
import confetti from 'canvas-confetti';
import { 
  Terminal, 
  CheckCircle2, 
  RotateCw, 
  Sparkles, 
  ShieldCheck, 
  Check 
} from 'lucide-react';

interface RemediationModalProps {
  isOpen: boolean;
  incidentId: string;
  onClose: () => void;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  isOpen,
  incidentId,
  onClose,
}) => {
  const { isRemediating, remediationStep, remediationLogs } = useIncident();

  const STEPS = [
    { step: 1, label: 'Cluster Safety Check & Lock' },
    { step: 2, label: 'Runbook Verification' },
    { step: 3, label: 'Terminate PID #4819' },
    { step: 4, label: 'Expand RDS Pool (100 -> 300)' },
    { step: 5, label: 'Telemetry SLO Verification' },
    { step: 6, label: 'Archive to Operational Memory' },
  ];

  const isComplete = !isRemediating && remediationStep === 6;

  useEffect(() => {
    if (isComplete) {
      // Fire confetti celebration on successful remediation
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#10B981', '#38BDF8', '#8B5CF6'],
        });
      } catch (e) {
        // fallback
      }
    }
  }, [isComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Autonomous Remediation Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                  {isComplete ? 'REMEDIATION VERIFIED' : 'ACTIVE EXECUTION'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Executing automated runbook for incident {incidentId}
              </p>
            </div>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <div className="grid grid-cols-6 gap-2">
            {STEPS.map((s) => {
              const isPast = remediationStep > s.step;
              const isCurrent = remediationStep === s.step;

              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-1.5 transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                        : isCurrent
                        ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan animate-pulse ring-4 ring-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                  </div>
                  <span className={`text-[10px] font-mono leading-tight ${
                    isCurrent ? 'text-cyan-300 font-bold' : isPast ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Terminal Output Stream */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-black/80 border border-slate-800 p-4 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1.5 shadow-inner">
            <div className="text-slate-500 pb-1 border-b border-slate-800 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                TRACE Runbook Orchestration Kernel v4.2
              </span>
              <span className="text-slate-600">CLUSTER: PROD-RIYADH-01</span>
            </div>

            {remediationLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 leading-relaxed">
                <span className="text-cyan-500 select-none">&gt;</span>
                <span className={
                  log.includes('[SUCCESS]') || log.includes('normalized')
                    ? 'text-emerald-400 font-semibold'
                    : log.includes('terminated')
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }>
                  {log}
                </span>
              </div>
            ))}

            {isRemediating && (
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse pt-1">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing cluster commands...</span>
              </div>
            )}
          </div>

          {/* Verification Status Card */}
          {isComplete && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/50 shadow-glow-emerald">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Incident {incidentId} Successfully Remediated & Resolved
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Connection pool ceiling dynamically raised to 300 • Query PID #4819 terminated • Latency reduced from 4,820ms to 68ms • 0.00% error rate.
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Archived to Operational Institutional Memory
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  View Resolved Status
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
