import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, FileWarning } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';

interface AccessDeniedViewProps {
  resourceId?: string;
  reason?: string;
  onBack: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ 
  resourceId = 'RESOURCE-RESTRICTED', 
  reason = 'You do not possess the required RBAC clearance level to inspect or modify this operational resource.',
  onBack 
}) => {
  const { currentUser } = useIncident();
  const eventId = `SEC-AUD-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = new Date().toISOString();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#101828] border border-red-500/40 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Glowing red accent ambient backlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 shrink-0 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                HTTP 403 FORBIDDEN
              </span>
              <span className="text-xs font-mono text-slate-500">
                RBAC POLICY VIOLATION
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-2">
              Security Access Denied
            </h2>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {reason}
            </p>

            {/* Audit Metadata box */}
            <div className="mt-6 p-4 rounded-xl bg-[#0F1319] border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>SECURITY EVENT ID:</span>
                <span className="text-red-400 font-bold">{eventId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>TARGET RESOURCE:</span>
                <span className="text-slate-200">{resourceId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>CALLING IDENTITY:</span>
                <span className="text-slate-200">{currentUser.name} ({currentUser.role.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>TIMESTAMP:</span>
                <span className="text-slate-400">{timestamp}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-800 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Lock className="w-3 h-3" /> Immutable Audit Log
                </span>
                <span className="text-slate-500">Recorded to audit_log</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </button>

              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <FileWarning className="w-3.5 h-3.5 text-amber-500" />
                Zero-Trust NOC Enforcement
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
