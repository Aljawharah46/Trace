import React, { useState } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { Incident } from '../../types';
import { 
  Search, 
  Check, 
  Copy, 
  Sparkles, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface IncidentTriageTableProps {
  onInvestigate: (incidentId: string) => void;
  onNavigateToMemory: () => void;
}

export const IncidentTriageTable: React.FC<IncidentTriageTableProps> = ({
  onInvestigate,
  onNavigateToMemory,
}) => {
  const { 
    incidents, 
    currentUser, 
    assignTicket, 
    activeTab, 
    setActiveTab 
  } = useIncident();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter based on activeTab
  const getTabFilteredIncidents = () => {
    switch (activeTab) {
      case 'triage':
        // Unassigned Queue
        return incidents.filter((i) => !i.assignedSpecialist && i.status !== 'Resolved');
      case 'assigned':
        // Assigned to Me
        return incidents.filter(
          (i) => i.assignedSpecialist?.id === currentUser.id && i.status !== 'Resolved'
        );
      case 'all':
        return incidents;
      case 'memory':
        return []; // Navigated to memory view
      default:
        return incidents;
    }
  };

  const displayedIncidents = getTabFilteredIncidents().filter((inc) => {
    if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchId = inc.id.toLowerCase().includes(q);
      const matchService = inc.affectedService.toLowerCase().includes(q);
      const matchCategory = inc.category.toLowerCase().includes(q);
      const matchSubmitter = inc.submitter.name.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchService && !matchCategory && !matchSubmitter) {
        return false;
      }
    }
    return true;
  });

  const getPriorityBadge = (priority: Incident['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-orange-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Submitted
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Under Review
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Resolved
          </span>
        );
    }
  };

  const unassignedCount = incidents.filter(
    (i) => !i.assignedSpecialist && i.status !== 'Resolved'
  ).length;

  const assignedToMeCount = incidents.filter(
    (i) => i.assignedSpecialist?.id === currentUser.id && i.status !== 'Resolved'
  ).length;

  return (
    <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Triage Header & Filter Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          
          <button
            onClick={() => setActiveTab('triage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'triage'
                ? 'bg-cyan-600 text-white shadow-glow-cyan font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Unassigned Queue</span>
            {unassignedCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'triage' ? 'bg-cyan-900 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {unassignedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'assigned'
                ? 'bg-cyan-600 text-white shadow-glow-cyan font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Assigned to Me</span>
            {assignedToMeCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'assigned' ? 'bg-cyan-900 text-white' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {assignedToMeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-cyan-600 text-white shadow-glow-cyan font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>All Incidents ({incidents.length})</span>
          </button>

          <button
            onClick={onNavigateToMemory}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-950/30 border border-transparent hover:border-purple-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Operational Memory</span>
          </button>

        </div>

        {/* Search & Priority Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-[11px] font-mono">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  priorityFilter === p
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents, services, users..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

      </div>

      {/* Incident Triage Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Request ID</th>
              <th className="py-3.5 px-4 min-w-[220px]">Title & Affected Service</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Submitter</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Business Impact</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {displayedIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                  No active incidents found matching criteria.
                </td>
              </tr>
            ) : (
              displayedIncidents.map((incident) => {
                const isCritical = incident.priority === 'CRITICAL';
                const isAssignedToMe = incident.assignedSpecialist?.id === currentUser.id;

                return (
                  <tr
                    key={incident.id}
                    onClick={() => onInvestigate(incident.id)}
                    className={`transition-colors cursor-pointer group ${
                      isCritical
                        ? 'bg-red-950/10 hover:bg-red-950/20 border-l-2 border-l-red-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Priority Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getPriorityBadge(incident.priority)}
                    </td>

                    {/* Request ID with Copy Button */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-cyan-400">
                        <span>{incident.id}</span>
                        <button
                          onClick={(e) => handleCopyId(incident.id, e)}
                          title="Copy Request ID"
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {copiedId === incident.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Title & Affected Service */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                        <span>{incident.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-400">
                        <span className="text-slate-500">Service:</span>
                        <span className="text-slate-300">
                          {incident.affectedService}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-300">
                        {incident.category}
                      </span>
                    </td>

                    {/* Submitter */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={incident.submitter.avatar || '/default.png'}
                          alt={incident.submitter.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
                          className="w-6 h-6 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="text-slate-200 font-medium text-xs">
                            {incident.submitter.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">
                            {incident.submitter.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(incident.status)}
                    </td>

                    {/* Business Impact */}
                    <td className="py-4 px-4">
                      <div className={`font-mono text-xs font-semibold ${
                        isCritical ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {incident.businessImpact}
                      </div>
                      {incident.riskAmountSAR > 0 && (
                        <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                          SAR {incident.riskAmountSAR.toLocaleString()} at risk
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Take Ticket Button (if unassigned or not assigned to me) */}
                        {!isAssignedToMe && incident.status !== 'Resolved' && (
                          <button
                            onClick={() => assignTicket(incident.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all hover:border-cyan-500/50"
                            title="Assign to Alex Vance & mark In Progress"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Take Ticket</span>
                          </button>
                        )}

                        {/* Investigate with AI Button */}
                        <button
                          onClick={() => onInvestigate(incident.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
                            isCritical
                              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-glow-red'
                              : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white hover:shadow-glow-cyan'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Investigate with AI</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>Showing {displayedIncidents.length} incidents in queue</div>
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Real-time NOC Telemetry Ingestion Active</span>
        </div>
      </div>

    </div>
  );
};
