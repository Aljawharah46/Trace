import React, { useState } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { Incident } from '../../types';
import { TechnicianSidebar } from './TechnicianSidebar';
import { EmployeeProfileView } from '../employee/EmployeeProfileView';
import { 
  Sparkles, 
  Search, 
  Send, 
  Layers, 
  Save, 
  PanelLeft, 
  ArrowLeft, 
  CheckCircle2, 
  Bell, 
  Calendar 
} from 'lucide-react';

interface TechnicianPortalProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  onInvestigate?: (incidentId: string) => void;
  onNavigateToMemory?: () => void;
}

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({ 
  isSidebarOpen: externalIsSidebarOpen,
  onToggleSidebar: externalOnToggleSidebar,
  onCloseSidebar: externalOnCloseSidebar,
  onInvestigate, 
  onNavigateToMemory 
}) => {
  const { 
    currentUser, 
    incidents, 
    updateTicketStatus,
    claimTicket
  } = useIncident();

  // Sidebar state
  const [internalIsSidebarOpen, setInternalIsSidebarOpen] = useState<boolean>(false);
  const isSidebarOpen = externalIsSidebarOpen !== undefined ? externalIsSidebarOpen : internalIsSidebarOpen;
  const toggleSidebar = externalOnToggleSidebar || (() => setInternalIsSidebarOpen(prev => !prev));
  const closeSidebar = externalOnCloseSidebar || (() => setInternalIsSidebarOpen(false));

  // Active Subview: 'home' (default), 'tasks', 'history', 'notifications', 'profile'
  const [activePortalView, setActivePortalView] = useState<'home' | 'tasks' | 'history' | 'notifications' | 'profile'>('home');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');

  // Three Classifications Filter: ALL, ACTIVE, RESOLVED
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Resolution form state
  const [resolutionStatus, setResolutionStatus] = useState<string>('Resolved');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [saveToKb, setSaveToKb] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const specialty = currentUser.specialty || 'Network';

  // IT Team Member: All tasks that appear are strictly assigned to this employee
  const assignedTickets = incidents.filter(
    (i) => i.assigned_to_user_id === currentUser.id
  );

  // Tasks View Pool: strictly assigned tasks for this employee
  const poolTickets = assignedTickets;

  const totalPoolCount = poolTickets.length;
  const activePoolCount = poolTickets.filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Resolved by AI' && i.status !== 'Resolved Instantly'
  ).length;

  const resolvedPoolCount = poolTickets.filter(
    (i) => i.status === 'Resolved' || i.status === 'Resolved by AI' || i.status === 'Resolved Instantly'
  ).length;

  // Active tasks for Home View: Active tasks assigned to current employee only
  const activeTasksPool = assignedTickets.filter(
    (inc) => inc.status !== 'Resolved' && inc.status !== 'Resolved by AI' && inc.status !== 'Resolved Instantly'
  );

  const displayedHomeTasks = activeTasksPool
    .filter((inc) => {
      if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) return false;
      if (
        searchQuery &&
        !inc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inc.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const priorityWeights: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return (priorityWeights[a.priority] || 5) - (priorityWeights[b.priority] || 5);
    });

  const displayedTickets = poolTickets
    .filter((inc) => {
      const isResolved = inc.status === 'Resolved' || inc.status === 'Resolved by AI' || inc.status === 'Resolved Instantly';
      if (statusFilter === 'ACTIVE' && isResolved) return false;
      if (statusFilter === 'RESOLVED' && !isResolved) return false;
      if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) return false;
      if (
        searchQuery &&
        !inc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inc.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const priorityWeights: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return (priorityWeights[a.priority] || 5) - (priorityWeights[b.priority] || 5);
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

  const handleUpdateStatusAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setIsUpdating(true);

    try {
      await updateTicketStatus(
        selectedIncident.id,
        resolutionStatus,
        newNote.trim() || undefined,
        resolutionSummary.trim() || undefined,
        saveToKb
      );
      setNewNote('');
      setIsUpdating(false);
      setSelectedIncident(null);
    } catch {
      setIsUpdating(false);
    }
  };

  const renderIncidentTable = (ticketsList: Incident[], emptyMessage: string = 'No tickets currently in this view.') => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#0F1319]/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-5 py-3">Priority</th>
            <th className="px-5 py-3">ID</th>
            <th className="px-5 py-3">Incident Title & AI Diagnosis</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Submitter</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-sans">
          {ticketsList.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-14 text-center text-slate-400 font-mono">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                {emptyMessage}
              </td>
            </tr>
          ) : (
            ticketsList.map((incident) => (
              <tr 
                key={incident.id}
                onClick={() => {
                  setSelectedIncident(incident);
                  setResolutionStatus(incident.status === 'Resolved' ? 'Resolved' : 'In Progress');
                  setResolutionSummary(incident.resolution_summary || '');
                }}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {getPriorityBadge(incident.priority)}
                </td>

                <td className="px-5 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                  {incident.id}
                </td>

                <td className="px-5 py-3.5 max-w-md">
                  <p className="font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                    {incident.title}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    {incident.ai_likely_cause || incident.likelyRootCause || incident.description}
                  </p>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0F1319] text-[#80A6D7] border border-slate-700">
                    {incident.category}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  {(() => {
                    const isResolved =
                      incident.status === 'Resolved' ||
                      incident.status === 'Resolved by AI' ||
                      incident.status === 'Resolved Instantly';
                    const isAssigned = Boolean(incident.assigned_to_user_id) || incident.status === 'Assigned' || incident.status === 'In Progress';

                    if (isResolved) {
                      return (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Completed
                        </span>
                      );
                    }

                    if (isAssigned) {
                      return (
                        <span className="text-xs font-mono font-bold text-amber-400">
                          In Progress
                        </span>
                      );
                    }

                    return (
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {incident.status || 'Open'}
                      </span>
                    );
                  })()}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400">
                  {incident.creator_name || incident.submitter?.name || 'Enterprise Employee'}
                </td>

                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {!incident.assigned_to_user_id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await claimTicket(incident.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-mono border border-emerald-500/40 transition-colors cursor-pointer"
                        title="Claim this task"
                      >
                        <span>Claim Task</span>
                      </button>
                    )}
                    {onInvestigate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInvestigate(incident.id);
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                      >
                        <span>NOC Deep-Dive</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedIncident(incident);
                        setResolutionStatus(incident.status === 'Resolved' ? 'Resolved' : 'In Progress');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Update / Resolve</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Filter for history subview: all tickets assigned to this technician that have been resolved
  const resolvedHistoryTickets = assignedTickets
    .filter(
      (inc) =>
        inc.status === 'Resolved' ||
        inc.status === 'Resolved by AI' ||
        inc.status === 'Resolved Instantly'
    )
    .filter((inc) => {
      if (!historySearchTerm.trim()) return true;
      const term = historySearchTerm.toLowerCase();
      return (
        inc.title.toLowerCase().includes(term) ||
        inc.id.toLowerCase().includes(term) ||
        (inc.likelyRootCause && inc.likelyRootCause.toLowerCase().includes(term)) ||
        (inc.description && inc.description.toLowerCase().includes(term))
      );
    });

  const technicianAlerts = [
    {
      id: 'alert-1',
      title: 'CRITICAL Priority Assignment: TRC-1001',
      description: 'Core Banking & Payment Gateway Latency Spike assigned directly to your queue.',
      timestamp: '10 mins ago',
      severity: 'CRITICAL',
      ticketId: 'TRC-1001'
    },
    {
      id: 'alert-2',
      title: 'AI Root-Cause Correlated',
      description: 'Telemetry correlation identified VIP failover flapping on leaf-04 router.',
      timestamp: '25 mins ago',
      severity: 'HIGH',
      ticketId: 'TRC-1001'
    },
    {
      id: 'alert-3',
      title: 'SLA Escalation Window Active',
      description: 'TRC-1002 target resolution deadline is within 45 minutes.',
      timestamp: '1 hour ago',
      severity: 'MEDIUM',
      ticketId: 'TRC-1002'
    },
    {
      id: 'alert-4',
      title: 'Institutional Knowledge Base Updated',
      description: 'New runbook mitigation steps archived from recently resolved incidents.',
      timestamp: '3 hours ago',
      severity: 'LOW'
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] w-full bg-[#0F1319] text-[#F8F7F8] flex flex-col font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          IT MEMBER COLLAPSIBLE DRAWER SIDEBAR
      ────────────────────────────────────────────────────────────── */}
      <TechnicianSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        activeView={activePortalView}
        onNavigate={(view) => setActivePortalView(view)}
        onNavigateToMemory={onNavigateToMemory}
      />

      {/* On-screen Minimalist Menu / Toggle Button (Hidden when sidebar is open) */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          type="button"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
          className="fixed top-20 left-4 z-30 p-2.5 rounded-xl bg-[#101828]/95 backdrop-blur-md border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white shadow-xl hover:shadow-[#80A6D7]/10 transition-all duration-200 cursor-pointer group active:scale-95 flex items-center justify-center"
        >
          <PanelLeft className="w-4 h-4 text-[#80A6D7] group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW A: DEDICATED PROFILE VIEW
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'profile' && (
        <EmployeeProfileView onBack={() => setActivePortalView('home')} backLabel="Back to Home" />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW B: DEDICATED RESOLVED PROBLEMS HISTORY VIEW
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'history' && (
        <div className="flex-1 max-w-5xl mx-auto w-full pl-16 sm:pl-20 lg:pl-24 pr-4 sm:pr-6 py-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivePortalView('home')}
                type="button"
                className="p-2 rounded-xl bg-[#101828] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer shadow-sm"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4 text-[#80A6D7]" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Resolved Incidents History
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Archived technical resolutions assigned to your queue
                </p>
              </div>
            </div>

            <button
              onClick={() => setActivePortalView('home')}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] text-[#0F1319] font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>

          {/* Search Filter Bar */}
          <div className="mb-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              placeholder="Search resolved problems by ticket ID, title, or root cause..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101828] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#80A6D7] transition-colors"
            />
          </div>

          {/* Ticket Grid / List */}
          {resolvedHistoryTickets.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-[#101828] border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No Resolved Incidents Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No resolved incidents or technical requests match your search criteria.
              </p>
              <button
                onClick={() => setActivePortalView('home')}
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-[#80A6D7] text-[#0F1319] font-bold text-xs cursor-pointer hover:bg-[#97bbed] transition-colors"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resolvedHistoryTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onInvestigate?.(ticket.id)}
                  className="rounded-2xl sm:rounded-3xl bg-[#101828] border border-slate-700/80 hover:border-slate-500 p-5 sm:p-6 flex flex-col justify-between transition-all shadow-xl text-left group cursor-pointer hover:shadow-2xl hover:shadow-black/50"
                  title="Click to inspect telemetry intelligence"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#80A6D7] bg-[#80A6D7]/10 px-2.5 py-0.5 rounded-lg border border-[#80A6D7]/20">
                          {ticket.id}
                        </span>
                        <span className="text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60 font-mono">
                          {ticket.category}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/10">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{ticket.status}</span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#80A6D7] transition-colors leading-snug">
                      {ticket.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="mt-4 rounded-xl p-4 bg-slate-900/50 border border-slate-800 text-xs space-y-2">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-slate-400 font-medium">Root Cause: </span>
                        <span>{ticket.likelyRootCause || 'Telemetry correlation verified.'}</span>
                      </div>
                      {ticket.resolution_summary && (
                        <div className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                          <span className="font-semibold text-slate-300">Resolution Summary: </span>
                          <span>{ticket.resolution_summary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{ticket.updatedAt || ticket.createdAt || 'Recent'}</span>
                    </div>
                    {onInvestigate && (
                      <span className="text-[#80A6D7] text-[11px] group-hover:underline">
                        Inspect Telemetry →
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW C: DEDICATED NOTIFICATIONS VIEW
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'notifications' && (
        <div className="flex-1 max-w-3xl mx-auto w-full pl-16 sm:pl-20 lg:pl-24 pr-4 sm:pr-6 py-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivePortalView('home')}
                type="button"
                className="p-2 rounded-xl bg-[#101828] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer shadow-sm"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4 text-[#80A6D7]" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  IT Operational Notifications
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Platform updates, assignment alerts, and SLA monitors
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {technicianAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-2xl bg-[#101828] border shadow-md transition-all ${
                  alert.severity === 'CRITICAL'
                    ? 'border-red-500/40 bg-red-950/10'
                    : alert.severity === 'HIGH'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${
                      alert.severity === 'CRITICAL' ? 'text-red-400 animate-pulse' : 'text-[#80A6D7]'
                    }`} />
                    <span className="text-xs font-bold text-white">
                      {alert.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {alert.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  {alert.description}
                </p>
                {alert.ticketId && onInvestigate && (
                  <div className="pl-6 mt-2.5">
                    <button
                      onClick={() => onInvestigate(alert.ticketId!)}
                      className="text-xs font-mono text-[#80A6D7] hover:text-[#97bbed] hover:underline cursor-pointer"
                    >
                      Inspect Ticket {alert.ticketId} →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN WORKSPACE 1: HOME (Attached Header Banner + Active Tasks Only)
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'home' && (
        <div className="max-w-[1720px] mx-auto pl-16 sm:pl-20 lg:pl-24 pr-4 sm:pr-6 lg:pr-8 py-8 space-y-6 animate-in fade-in duration-300 w-full">
          
          {/* Technician Profile & Specialty Banner (Attached Header) */}
          <div className="rounded-2xl bg-[#101828] border border-slate-700/80 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar || '/default.png'}
                alt={currentUser.name}
                onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#80A6D7]/60 shadow-lg"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {currentUser.name}
                </h1>
                <p className="text-xs sm:text-sm font-mono font-bold text-[#80A6D7] mt-1">
                  IT Team Member • {specialty} Specialist
                </p>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MY ASSIGNED</span>
                <span className="text-lg font-bold text-[#80A6D7]">{assignedTickets.length}</span>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ACTIVE IN PROGRESS</span>
                <span className="text-lg font-bold text-amber-400">
                  {assignedTickets.filter(i => i.status !== 'Resolved' && i.status !== 'Resolved by AI' && i.status !== 'Resolved Instantly').length}
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RESOLVED</span>
                <span className="text-lg font-bold text-emerald-400">
                  {assignedTickets.filter(i => i.status === 'Resolved' || i.status === 'Resolved by AI' || i.status === 'Resolved Instantly').length}
                </span>
              </div>
            </div>
          </div>

          {/* Active Tasks Only Card */}
          <div className="rounded-2xl bg-[#101828] border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header & Search/Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F1319]/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-base font-bold text-white">Active Tasks</h2>
              </div>

              {/* Search & Priority Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search active tasks..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#80A6D7]"
                  />
                </div>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#80A6D7]"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
              </div>
            </div>

            {/* Active Tasks Table */}
            {renderIncidentTable(displayedHomeTasks, 'No active tasks currently awaiting action.')}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN WORKSPACE 2: TASKS ONLY (Without Header Banner)
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'tasks' && (
        <div className="max-w-[1720px] mx-auto pl-16 sm:pl-20 lg:pl-24 pr-4 sm:pr-6 lg:pr-8 py-8 space-y-6 animate-in fade-in duration-300 w-full">
          
          {/* Main Tasks Card */}
          <div className="rounded-2xl bg-[#101828] border border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Tab & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0F1319]/60">
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Three Classifications: All, Active, Resolved */}
                <div className="flex items-center p-1 rounded-xl bg-[#0F1319] border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-[#1E293B] text-white font-bold border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>All</span>
                    <span className="px-2 py-0.2 rounded-full text-[11px] bg-[#80A6D7]/20 text-[#80A6D7] font-bold">
                      {totalPoolCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-[#1E293B] text-white font-bold border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Active</span>
                    <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                      activePoolCount > 0 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {activePoolCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('RESOLVED')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'RESOLVED'
                        ? 'bg-[#1E293B] text-white font-bold border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Resolved</span>
                    <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                      resolvedPoolCount > 0 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {resolvedPoolCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Search & Priority Controls */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ticket ID or keywords..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#80A6D7]"
                  />
                </div>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#80A6D7]"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
              </div>
            </div>

            {/* Requests Table */}
            {renderIncidentTable(displayedTickets, 'No tickets currently match this view filter.')}
          </div>

        </div>
      )}

      {/* Ticket Investigation & Resolve Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-3xl bg-[#101828] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0F1319]/80">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold font-mono text-white">
                  {selectedIncident.id}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-sm font-semibold text-slate-200 truncate max-w-md">
                  {selectedIncident.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleUpdateStatusAndNotes} className="p-6 overflow-y-auto space-y-6">
              
              {/* Problem Description */}
              <div className="p-4 rounded-xl bg-[#0F1319] border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
                <span className="text-slate-500 block mb-1 uppercase font-bold text-[10px]">
                  Employee Problem Description (PII Masked)
                </span>
                {selectedIncident.description}
              </div>

              {/* AI Triage & Root Cause Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#101828] to-[#1E293B] border border-slate-700 text-xs space-y-3">
                <div className="flex items-center gap-2 text-[#80A6D7] font-mono font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Incident Triage Synthesis</span>
                </div>
                <div className="space-y-1 font-mono text-slate-300">
                  <p><strong>Likely Root Cause:</strong> {selectedIncident.ai_likely_cause || selectedIncident.likelyRootCause}</p>
                  <p><strong>Technician Summary:</strong> {selectedIncident.ai_technician_summary || 'Analysis complete.'}</p>
                </div>
              </div>

              {/* Operational Notes History */}
              {selectedIncident.technician_notes && selectedIncident.technician_notes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                    Technician Notes & Audit Feed
                  </span>
                  <div className="space-y-2">
                    {selectedIncident.technician_notes.map((n, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#0F1319] border border-slate-800 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                          <span className="font-bold text-slate-200">{n.author}</span>
                          <span>{n.timestamp}</span>
                        </div>
                        <p className="text-slate-300 font-mono">{n.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Note Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Add Operational Note / Status Update
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter technician diagnostic update or action performed..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#80A6D7]"
                  />
                </div>
              </div>

              {/* Status Update & Resolution Form */}
              <div className="p-4 rounded-xl bg-[#0F1319] border border-slate-800 space-y-4">
                <span className="text-xs font-mono font-bold text-white uppercase block">
                  Resolve or Transition Ticket Status
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Status</label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101828] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#80A6D7]"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Completed</option>
                    </select>
                  </div>

                  {resolutionStatus === 'Resolved' && (
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveToKb}
                          onChange={(e) => setSaveToKb(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-[#80A6D7] focus:ring-0"
                        />
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#80A6D7]">
                          <Save className="w-3.5 h-3.5" />
                          Save to Knowledge Base (Operational Memory)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {resolutionStatus === 'Resolved' && (
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Final Resolution Summary (Archived to Knowledge Base)
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      placeholder="Detail the technical fix applied (e.g., Flushed BGP cache on edge gateway leaf-04 and renewed lease)..."
                      className="w-full px-3 py-2 rounded-xl bg-[#101828] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#80A6D7]"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] text-[#0F1319] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Update & Save Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
