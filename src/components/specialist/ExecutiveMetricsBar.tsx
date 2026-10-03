import React from 'react';
import { useIncident } from '../../context/IncidentContext';
import { 
  AlertOctagon, 
  TrendingUp, 
  Clock, 
  Zap 
} from 'lucide-react';

export const ExecutiveMetricsBar: React.FC = () => {
  const { incidents } = useIncident();

  // Active Critical Incidents
  const criticalIncidents = incidents.filter(
    (i) => i.priority === 'CRITICAL' && i.status !== 'Resolved'
  );

  // Business Risk at Stake (sum of riskAmountSAR for active critical and high incidents)
  const totalRiskSAR = incidents
    .filter((i) => i.status !== 'Resolved')
    .reduce((sum, i) => sum + i.riskAmountSAR, 0);

  const totalAffectedTxns = incidents
    .filter((i) => i.status !== 'Resolved')
    .reduce((sum, i) => sum + i.affectedTxns, 0);

  // Unassigned Queue count
  const unassignedCount = incidents.filter(
    (i) => !i.assignedSpecialist && i.status !== 'Resolved'
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* CARD 1: Critical Incidents */}
      <div className="relative group p-5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-700/70 hover:border-red-500/50 transition-all duration-300 shadow-xl backdrop-blur-xl overflow-hidden">
        {/* Subtle red glow effect for critical state */}
        {criticalIncidents.length > 0 && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Critical Incidents
            </span>
            {criticalIncidents.length > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 pulse-indicator-critical"></span>
              </span>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-glow-red">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {criticalIncidents.length}
            </span>
            <span className="text-xs font-mono font-semibold text-red-400">
              {criticalIncidents.length === 1 ? 'P1 Active' : 'P1 Active Outages'}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-xs font-mono text-red-400 font-semibold">
              Immediate Triage Required
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Checkout Gateway SLO</span>
          <span className="text-red-400 font-bold">Violated (p99 &gt; 4.8s)</span>
        </div>
      </div>

      {/* CARD 2: Business Risk at Stake */}
      <div className="relative group p-5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-700/70 hover:border-amber-500/50 transition-all duration-300 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Business Risk at Stake
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300 tracking-tight">
              SAR {totalRiskSAR.toLocaleString()}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <span className="text-amber-400 font-bold">{totalAffectedTxns.toLocaleString()}</span>
            <span>affected txns in pipeline</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Revenue Burn Rate</span>
          <span className="text-amber-400 font-bold">~SAR 71K / min</span>
        </div>
      </div>

      {/* CARD 3: Unassigned Queue */}
      <div className="relative group p-5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-700/70 hover:border-cyan-500/50 transition-all duration-300 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Unassigned Queue
          </span>
          <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {unassignedCount}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Pending Assignment
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300">
              Avg Triage Time: 1.8 mins
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Queue Health</span>
          <span className="text-emerald-400 font-bold">Optimal Dispatch</span>
        </div>
      </div>

      {/* CARD 4: MTTR (Mean Time to Resolve) */}
      <div className="relative group p-5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-700/70 hover:border-emerald-500/50 transition-all duration-300 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            MTTR Benchmark
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              24m
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              AI Assisted (-40%)
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <span className="text-slate-400">Baseline Manual:</span>
            <span className="line-through text-slate-500">40m</span>
            <span className="text-emerald-400 font-bold">Saved 16m</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Runbook Automation</span>
          <span className="text-cyan-400 font-bold">92% Executed</span>
        </div>
      </div>

    </div>
  );
};
