import React from 'react';
import { ExecutiveMetricsBar } from './ExecutiveMetricsBar';
import { IncidentTriageTable } from './IncidentTriageTable';
import { Activity } from 'lucide-react';

interface SpecialistDashboardProps {
  onInvestigate: (incidentId: string) => void;
  onNavigateToMemory: () => void;
}

export const SpecialistDashboard: React.FC<SpecialistDashboardProps> = ({
  onInvestigate,
  onNavigateToMemory,
}) => {

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Triage Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>NOC Command Center & Incident Response Mesh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            IT Incident & Triage Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Correlated telemetry ingestion, real-time blast-radius assessment, and autonomous AI remediation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Mesh: 99.98% Healthy</span>
          </div>
        </div>
      </div>

      {/* A. Executive Metrics Bar (4 Glassmorphism Cards) */}
      <ExecutiveMetricsBar />

      {/* B. Incident Triage Table & Filters */}
      <IncidentTriageTable
        onInvestigate={onInvestigate}
        onNavigateToMemory={onNavigateToMemory}
      />

    </div>
  );
};
