import React, { useState } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { TelemetryTimeline } from './TelemetryTimeline';
import { VisualServiceTopology } from './VisualServiceTopology';
import { AICopilotDrawer } from './AICopilotDrawer';
import { RemediationModal } from './RemediationModal';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Database, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Bot
} from 'lucide-react';

interface AIIncidentIntelligencePageProps {
  incidentId: string;
  onBack: () => void;
  onNavigateToMemory: () => void;
}

export const AIIncidentIntelligencePage: React.FC<AIIncidentIntelligencePageProps> = ({
  incidentId,
  onBack,
  onNavigateToMemory,
}) => {
  const { 
    incidents, 
    telemetry, 
    topologyNodes, 
    applyAutomatedFix, 
    isRemediating 
  } = useIncident();

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isRemediationModalOpen, setIsRemediationModalOpen] = useState(false);
  const [showMemoryComparison, setShowMemoryComparison] = useState(false);

  // Find incident
  const incident = incidents.find((i) => i.id === incidentId) || incidents[0];
  const isResolved = incident.status === 'Resolved';

  const handleApplyFix = async () => {
    setIsRemediationModalOpen(true);
    await applyAutomatedFix(incident.id);
  };

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Incident Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#1E293B] border border-slate-700/80 shadow-2xl">
        
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors border border-slate-700 hover:border-cyan-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Command Center</span>
          </button>

          <div className="h-6 w-px bg-slate-700 hidden sm:block" />

          {/* ID, Priority & Status */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono text-cyan-400">
              {incident.id}
            </span>

            {/* Priority Badge */}
            {incident.priority === 'CRITICAL' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                CRITICAL (P1)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-orange-400">
                {incident.priority}
              </span>
            )}

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold ${
              isResolved ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {isResolved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resolved</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>In Progress</span>
                </>
              )}
            </span>
          </div>

          {/* Real-time AI Analysis Complete Indicator (Clean text) */}
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Analysis Complete ({incident.aiConfidence || 98}% Confidence)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          
          {/* AI Copilot Drawer Toggle Button */}
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>TRACE Copilot</span>
          </button>

          {/* Apply Recommended Fix & Resolve Button */}
          {!isResolved ? (
            <button
              onClick={handleApplyFix}
              disabled={isRemediating}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 hover:shadow-glow-emerald transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Apply Recommended Fix & Resolve</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Incident Remediated & Archived</span>
            </div>
          )}

        </div>

      </div>

      {/* Incident Title & Submitter Sub-bar */}
      <div className="px-5 py-3 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{incident.title}</span>
            <span className="text-xs font-mono text-slate-400 font-normal">
              on service <span className="text-slate-200 font-mono">{incident.affectedService}</span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{incident.description}</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Reported by: <strong className="text-slate-200">{incident.submitter.name}</strong> ({incident.submitter.department})</span>
          <span>•</span>
          <span>Created: <strong className="text-slate-200">{incident.createdAt}</strong></span>
        </div>
      </div>

      {/* 2. Business Impact Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#162032] to-[#0B0F17] border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Real-time Business Impact & Blast Radius Assessment</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Calculated via TRACE Enterprise FinOps Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
              AFFECTED TRANSACTIONS
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {incident.affectedTxns.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-red-400">(-82.4% success)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Aborted checkout sessions</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
              ESTIMATED FINANCIAL RISK
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-amber-300">
                SAR {incident.riskAmountSAR.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cart value in payment gateway pipe</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
              DOWNSTREAM IMPACT
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-cyan-300">3 Services</span>
              <span className="text-xs font-mono text-amber-400">Cascading</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Payment GW, Redis, Checkout API</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
              CUSTOMER CHURN RISK
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-red-400">CRITICAL</span>
              <span className="text-xs font-mono text-red-300">Top Tier</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">28,400 active concurrent visitors</p>
          </div>

        </div>
      </div>

      {/* Grid: Telemetry Timeline (Left) & Visual Topology (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 3. Telemetry & Live Event Timeline (5 cols) */}
        <div className="lg:col-span-5 h-[580px]">
          <TelemetryTimeline events={telemetry} />
        </div>

        {/* 4. Visual Service Topology (7 cols) */}
        <div className="lg:col-span-7 h-[580px]">
          <VisualServiceTopology nodes={topologyNodes} />
        </div>

      </div>

      {/* Bottom Row: AI Analysis & Mitigation (Left) + Operational Memory Match (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 5. AI Analysis & Mitigation Panel (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#1E293B] border border-slate-700/80 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Analysis & Autonomous Mitigation</h3>
                  <p className="text-xs text-slate-400">Synthesized from 12,000 logs and distributed telemetry traces</p>
                </div>
              </div>

              <span className="text-xs font-mono text-emerald-400 font-bold">
                98% Confidence Score
              </span>
            </div>

            {/* Likely Root Cause */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 mb-4">
              <div className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider mb-1.5 flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Likely Root Cause</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {incident.likelyRootCause}
              </p>
              <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <code>PID #4819: SELECT * FROM txn_ledger WHERE status = 'PENDING' FOR UPDATE; (Duration: 842s, Table Lock: EXCLUSIVE)</code>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <div className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-2">
                Prescribed Remediation Actions:
              </div>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Increase DB Connection Pool size from 100 to 300
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Dynamically updates Aurora parameter group <span className="text-slate-200 font-mono">max_connections=300</span> without restart.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Terminate PID #4819 long-running unindexed query
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Executes <span className="text-slate-200 font-mono">SELECT pg_terminate_backend(4819)</span> on Primary Writer DB to release 42 table locks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-mono">
              Zero-Downtime Hotfix Execution • Estimated Recovery: &lt;30 seconds
            </div>

            {!isResolved ? (
              <button
                onClick={handleApplyFix}
                disabled={isRemediating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-glow-emerald transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Apply Recommended Fix & Resolve</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fix Successfully Applied & Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. Operational Memory Match (Institutional Memory) (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#1E293B] border border-slate-700/80 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Operational Memory Match</h3>
                  <p className="text-xs text-slate-400">Historical pattern correlation across past post-mortems</p>
                </div>
              </div>

              <span className="text-xs font-mono text-purple-400 font-bold">
                89% Similarity Match
              </span>
            </div>

            {/* Historical Incident Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-purple-400">#TRC-0421</span>
                  <span className="text-[10px] font-mono text-slate-400">(Resolved 45 days ago)</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">MTTR: 18 mins</span>
              </div>

              <div className="text-xs font-bold text-white">
                Payment Gateway Connection Timeout & Connection Starvation
              </div>

              <div className="text-xs text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase">Past Root Cause:</span>
                Connection pool saturation caused by unindexed batch query during reconciliation job.
              </div>

              <div className="text-xs text-slate-300 font-mono pt-1">
                <span className="text-slate-500 block text-[10px] uppercase">Past Resolution Steps:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 mt-1">
                  <li>Scaled connection pool from 100 to 300 via Aurora parameter group</li>
                  <li>Terminated blocking analytical transaction session on DB master</li>
                  <li>Applied missing compound index on (status, created_at)</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Resolved By: <strong className="text-purple-300">Sarah Connor (Staff SRE)</strong></span>
                <span className="text-emerald-400 font-semibold">Saved SAR 780,000</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setShowMemoryComparison(!showMemoryComparison)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 transition-colors"
            >
              <span>{showMemoryComparison ? 'Hide Telemetry Diff' : 'Compare Telemetry Signature'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onNavigateToMemory}
              className="px-3.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold transition-all"
            >
              Open Operational Memory
            </button>
          </div>

          {/* Telemetry Diff Simulation */}
          {showMemoryComparison && (
            <div className="mt-4 p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 animate-in fade-in">
              <div className="text-cyan-400 font-bold">Vector Similarity Analysis:</div>
              <div className="flex justify-between">
                <span>Database Connection Pool Signature:</span>
                <span className="text-emerald-400 font-bold">96% match</span>
              </div>
              <div className="flex justify-between">
                <span>HTTP 504 Gateway Timeout Distribution:</span>
                <span className="text-emerald-400 font-bold">92% match</span>
              </div>
              <div className="flex justify-between">
                <span>Affected Downstream Node Tree:</span>
                <span className="text-emerald-400 font-bold">100% match</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 7. AI Copilot Drawer */}
      <AICopilotDrawer
        incident={incident}
        isOpen={isCopilotOpen}
        onToggle={() => setIsCopilotOpen(!isCopilotOpen)}
      />

      {/* Automated Remediation Modal */}
      <RemediationModal
        isOpen={isRemediationModalOpen}
        incidentId={incident.id}
        onClose={() => setIsRemediationModalOpen(false)}
      />

    </div>
  );
};
