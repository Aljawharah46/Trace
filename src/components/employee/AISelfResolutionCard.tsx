import React, { useState } from 'react';
import { Incident } from '../../types';
import { useIncident } from '../../context/IncidentContext';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Archive,
  Loader2
} from 'lucide-react';

interface AISelfResolutionCardProps {
  incident: Incident;
  onStatusUpdated?: () => void;
}

export const AISelfResolutionCard: React.FC<AISelfResolutionCardProps> = ({ 
  incident, 
  onStatusUpdated 
}) => {
  const { currentUser, refreshIncidents, addToast } = useIncident();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fixSteps: string[] = incident.ai_fix_steps && incident.ai_fix_steps.length > 0
    ? incident.ai_fix_steps
    : (incident.recommendedActions || ['Verify connectivity and restart session']);

  const totalSteps = fixSteps.length;
  const currentStep = fixSteps[currentStepIndex] || fixSteps[0];

  const handleSelfResolve = async (worked: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/requests/${incident.id}/self-resolve`, {
        method: 'POST',
        headers: {
          'X-User-Id': currentUser.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          worked,
          step_index: currentStepIndex
        })
      });

      if (res.ok) {
        if (worked) {
          addToast('Issue Self-Resolved!', 'Marked as Resolved by AI and saved to Knowledge Base.', 'success');
        } else {
          addToast('Escalated to Specialist', `Escalated to ${incident.category} Specialist queue.`, 'info');
        }
        await refreshIncidents();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch {
      // Local optimistic fallback
      if (worked) {
        incident.status = 'Resolved by AI';
        addToast('Issue Self-Resolved!', 'Marked as Resolved by AI.', 'success');
      } else {
        incident.status = 'Escalated';
        addToast('Escalated to Specialist', `Escalated to ${incident.category} Specialist queue.`, 'info');
      }
      if (onStatusUpdated) onStatusUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStepOrEscalate = () => {
    if (currentStepIndex + 1 < totalSteps) {
      setCurrentStepIndex(prev => prev + 1);
      addToast('Advancing Step', `Proceeding to troubleshooting step ${currentStepIndex + 2} of ${totalSteps}.`, 'info');
    } else {
      // All steps exhausted, escalate
      handleSelfResolve(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#101828] border border-slate-700/80 p-5 shadow-xl space-y-4">
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#1E293B] border border-slate-700 text-[#80A6D7]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-mono">
              TRACE AI Self-Resolution Assistant
            </span>
            <div className="text-[11px] text-slate-400 font-mono">
              Incident: <strong className="text-white">{incident.id}</strong> • Confidence: <strong className="text-emerald-400">{Math.round((incident.ai_confidence || 0.9) * 100)}%</strong>
            </div>
          </div>
        </div>

        {/* Priority Badge */}
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
          incident.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          incident.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
          incident.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {incident.priority} PRIORITY
        </span>
      </div>

      {/* State 1: Active Interactive Self-Resolution (Status: 'AI Suggested' or 'New') */}
      {incident.status === 'AI Suggested' && (
        <div className="space-y-4">
          
          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1.5">
              <span>TROUBLESHOOTING STEP {currentStepIndex + 1} OF {totalSteps}</span>
              <span className="text-[#80A6D7]">{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% COMPLETE</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#80A6D7] to-emerald-400 transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Likely Cause synthesis */}
          <div className="p-3.5 rounded-xl bg-[#0F1319] border border-slate-800 text-xs">
            <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
              AI Inferred Root Cause:
            </span>
            <p className="text-slate-200 leading-relaxed font-mono">
              {incident.ai_likely_cause || incident.likelyRootCause || 'Service negotiation issue detected.'}
            </p>
          </div>

          {/* Current Step Instruction Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#101828] to-[#1E293B] border border-slate-700 shadow-md">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#80A6D7] text-[#0F1319] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {currentStepIndex + 1}
              </span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-white">Recommended Action:</span>
                <p className="text-sm text-[#F8F7F8] font-medium mt-1 leading-relaxed">
                  {currentStep}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: "It worked" / "Didn't work" */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelfResolve(false)}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip steps & escalate to human technician
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              {/* Button: Didn't work */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleNextStepOrEscalate}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span>{currentStepIndex + 1 < totalSteps ? "Didn't work ⏭️" : "Didn't work (Escalate)"}</span>
              </button>

              {/* Button: It worked */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelfResolve(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                )}
                <span>It worked! 🎉</span>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* State 2: Resolved by AI */}
      {incident.status === 'Resolved by AI' && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully Resolved via Autonomous AI</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {incident.resolution_summary || 'Self-resolution verified by employee. This remediation pattern was automatically archived into Operational Memory.'}
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-400/80 border-t border-emerald-900/50">
            <Archive className="w-3.5 h-3.5" />
            <span>Archived to Institutional Operational Memory KB</span>
          </div>
        </div>
      )}

      {/* State 3: Escalated / Assigned to Human Technician */}
      {(incident.status === 'Escalated' || incident.status === 'Assigned' || incident.status === 'In Progress') && (
        <div className="p-4 rounded-xl bg-[#0F1319] border border-amber-500/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <UserCheck className="w-4 h-4" />
              <span>Escalated to Human Technical Operations</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
              {incident.category.toUpperCase()} QUEUE
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed font-mono">
            {incident.ai_technician_summary || 'Incident escalated. Specialist is reviewing telemetry and diagnostic runbooks.'}
          </p>
          {incident.assignee_name && (
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Assigned Specialist: <strong className="text-white">{incident.assignee_name}</strong></span>
              <span className="text-emerald-400">• Active in Queue</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
