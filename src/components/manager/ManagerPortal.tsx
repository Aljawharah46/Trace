import React, { useState } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { Incident } from '../../types';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Users, 
  Zap, 
  Layers, 
  BookOpen,
  PieChart,
  LogOut
} from 'lucide-react';

interface ManagerPortalProps {
  onInvestigate?: (incidentId: string) => void;
  onNavigateToMemory?: () => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({ 
  onInvestigate, 
  onNavigateToMemory 
}) => {
  const { 
    currentUser, 
    incidents, 
    assignTicketTo, 
    demoUsers,
    logout
  } = useIncident();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Unassigned requests that need assignment
  const unassignedIncidents = incidents.filter(
    (i) => (!i.assigned_to_user_id || i.assigned_to_user_id === null) &&
           i.status !== 'Resolved' &&
           i.status !== 'Resolved by AI'
  );

  // Technicians list
  const technicians = [
    demoUsers.usr_tech_alex,
    demoUsers.usr_tech_faisal,
    demoUsers.usr_tech_maya,
  ];

  // Helper: AI Recommendation for an unassigned incident based on specialty & active workload
  const getAiRecommendation = (incident: Incident) => {
    // 1. Filter technicians matching incident category
    const matchingTechs = technicians.filter(t => t.specialty === incident.category);
    const pool = matchingTechs.length > 0 ? matchingTechs : technicians;

    // 2. Count active tickets per tech in pool
    const scored = pool.map(tech => {
      const activeCount = incidents.filter(
        i => i.assigned_to_user_id === tech.id && i.status !== 'Resolved' && i.status !== 'Resolved by AI'
      ).length;
      return { tech, activeCount };
    });

    // 3. Pick technician with lowest active load
    scored.sort((a, b) => a.activeCount - b.activeCount);
    return scored[0];
  };

  // Metrics calculations
  const totalIncidents = incidents.length;
  const resolvedByAiCount = incidents.filter(i => i.status === 'Resolved by AI').length;
  const aiSelfResRate = totalIncidents > 0 ? Math.round((resolvedByAiCount / totalIncidents) * 100) : 40;
  const criticalCount = incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'Resolved' && i.status !== 'Resolved by AI').length;

  const categoryBreakdown = {
    Network: incidents.filter(i => i.category === 'Network').length,
    Software: incidents.filter(i => i.category === 'Software').length,
    Hardware: incidents.filter(i => i.category === 'Hardware').length,
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (
      searchQuery &&
      !inc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inc.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: Incident['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
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

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#101828] border border-slate-700/80 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar || '/default.png'}
            alt={currentUser.name}
            onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {currentUser.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                OPERATIONS MANAGER & COMMANDER
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Global Operations Overview • Intelligent Workload Balancing & SLA Enforcement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToMemory && (
            <button
              onClick={onNavigateToMemory}
              className="px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#80A6D7]" />
              <span>Search Operational Memory</span>
            </button>
          )}

          <button
            onClick={() => logout()}
            className="px-3.5 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Executive Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: AI Self-Resolution Rate */}
        <div className="p-5 rounded-2xl bg-[#101828] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>AI SELF-RESOLUTION RATE</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">{aiSelfResRate}%</span>
            <span className="text-xs text-slate-400 font-mono">({resolvedByAiCount} resolved by AI)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">
            Zero-touch employee issue remediation
          </div>
        </div>

        {/* Metric 2: Average MTTR */}
        <div className="p-5 rounded-2xl bg-[#101828] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>AVERAGE RESOLUTION TIME</span>
            <Clock className="w-4 h-4 text-[#80A6D7]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">22 mins</span>
            <span className="text-xs text-emerald-400 font-mono">-40% vs SLA</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">
            Benchmark: 40m Enterprise SLA
          </div>
        </div>

        {/* Metric 3: Critical Incidents */}
        <div className="p-5 rounded-2xl bg-[#101828] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>CRITICAL INCIDENTS (P1)</span>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-red-400">{criticalCount}</span>
            <span className="text-xs text-slate-400 font-mono">active P1 triage</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">
            Direct revenue/operations impact
          </div>
        </div>

        {/* Metric 4: Unassigned Queue */}
        <div className="p-5 rounded-2xl bg-[#101828] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>UNASSIGNED QUEUE</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">{unassignedIncidents.length}</span>
            <span className="text-xs text-slate-400 font-mono">tickets pending assignment</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">
            AI Auto-Assignment suggestions below
          </div>
        </div>

      </div>

      {/* Row 2: AI Workload Balancing & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Technician Workload Distribution */}
        <div className="lg:col-span-2 rounded-2xl bg-[#101828] border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#80A6D7]" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Technician Workload & Specialty Distribution
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">3 SRE Specialists Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {technicians.map((tech) => {
              const activeLoad = incidents.filter(
                i => i.assigned_to_user_id === tech.id && i.status !== 'Resolved' && i.status !== 'Resolved by AI'
              ).length;
              return (
                <div key={tech.id} className="p-4 rounded-xl bg-[#0F1319] border border-slate-800 flex items-center gap-3">
                  <img
                    src={tech.avatar || '/default.png'}
                    alt={tech.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{tech.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tech.specialty} Specialist</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Active Load:</span>
                      <span className={`font-bold ${activeLoad > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeLoad} tickets
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl bg-[#101828] border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Frequent Issues Breakdown
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Network & VPN</span>
                <span>{categoryBreakdown.Network} tickets</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-cyan-400" 
                  style={{ width: `${totalIncidents > 0 ? (categoryBreakdown.Network / totalIncidents) * 100 : 33}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Software & SSO / DB</span>
                <span>{categoryBreakdown.Software} tickets</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-indigo-400" 
                  style={{ width: `${totalIncidents > 0 ? (categoryBreakdown.Software / totalIncidents) * 100 : 33}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Hardware & Datacenter</span>
                <span>{categoryBreakdown.Hardware} tickets</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-400" 
                  style={{ width: `${totalIncidents > 0 ? (categoryBreakdown.Hardware / totalIncidents) * 100 : 33}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI-Powered Assignment Assistant for Unclaimed Requests */}
      {unassignedIncidents.length > 0 && (
        <div className="rounded-2xl bg-[#101828] border border-cyan-500/40 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  AI-Powered Assignment Assistant ({unassignedIncidents.length} Unclaimed Tickets)
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  TRACE algorithm evaluates ticket category, technician specialty, and current queue saturation.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {unassignedIncidents.map((inc) => {
              const rec = getAiRecommendation(inc);
              return (
                <div 
                  key={inc.id}
                  className="p-4 rounded-xl bg-[#0F1319] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{inc.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-semibold text-slate-200">{inc.title}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-[#80A6D7] border border-slate-700">
                        {inc.category}
                      </span>
                      {getPriorityBadge(inc.priority)}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Recommended: <strong className="text-cyan-300">{rec.tech.name}</strong> ({rec.tech.specialty} Specialist, currently {rec.activeCount} active tickets)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => assignTicketTo(inc.id, rec.tech.id)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Accept AI Recommendation</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Requests Table */}
      <div className="rounded-2xl bg-[#101828] border border-slate-800 overflow-hidden shadow-2xl">
        
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0F1319]/60">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Global Incident Management Table</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {filteredIncidents.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all tickets..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#80A6D7]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#80A6D7]"
            >
              <option value="ALL">All Categories</option>
              <option value="Network">Network</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#80A6D7]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#80A6D7]"
            >
              <option value="ALL">All Statuses</option>
              <option value="AI Suggested">AI Suggested</option>
              <option value="Escalated">Escalated</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Resolved by AI">Resolved by AI</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1319]/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Incident Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitter</th>
                <th className="px-5 py-3">Assigned Specialist</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-mono">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No tickets found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getPriorityBadge(incident.priority)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                      {incident.id}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate">
                      <span className="font-semibold text-slate-200">{incident.title}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-[#80A6D7] border border-slate-700">
                        {incident.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-300">
                      {incident.status}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400">
                      {incident.creator_name || incident.submitter?.name}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {incident.assignee_name || incident.assignedSpecialist?.name ? (
                        <span className="text-emerald-400 font-medium font-mono text-[11px]">
                          {incident.assignee_name || incident.assignedSpecialist?.name}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onInvestigate && (
                          <button
                            onClick={() => onInvestigate(incident.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
                          >
                            <span>⚡ NOC Triage</span>
                          </button>
                        )}
                        <select
                          value={incident.assigned_to_user_id || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              assignTicketTo(incident.id, e.target.value);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-[#0F1319] border border-slate-700 text-[11px] text-slate-200 font-mono focus:outline-none"
                        >
                          <option value="">Reassign...</option>
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.specialty})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
