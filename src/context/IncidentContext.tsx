import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  Incident, 
  TelemetryEvent, 
  TopologyNode, 
  OperationalMemoryItem,
  ExecutiveMetrics,
  Priority
} from '../types';
import { 
  DEMO_USERS, 
  INITIAL_INCIDENTS, 
  TELEMETRY_TIMELINE, 
  TOPOLOGY_NODES, 
  OPERATIONAL_MEMORY_ITEMS 
} from '../data/mockData';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'success' | 'info' | 'warning';
  timestamp: string;
}

export interface AccessDeniedState {
  resourceId: string;
  reason: string;
}

interface IncidentContextType {
  currentUser: User;
  currentRole: UserRole;
  isAuthenticated: boolean;
  currentPath: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  loginWithUserId: (credential: string, password?: string) => Promise<boolean>;
  loginAs: (role: any) => void;
  logout: () => void;
  incidents: Incident[];
  activeInvestigationId: string | null;
  setActiveInvestigationId: (id: string | null) => void;
  investigateTicket: (incidentId: string) => Promise<boolean>;
  accessDeniedState: AccessDeniedState | null;
  clearAccessDenied: () => void;
  claimTicket: (incidentId: string) => Promise<boolean>;
  assignTicket: (incidentId: string) => void;
  assignTicketTo: (incidentId: string, technicianId: string) => Promise<boolean>;
  updateTicketStatus: (
    incidentId: string, 
    status: string, 
    note?: string, 
    resolutionSummary?: string, 
    saveToKb?: boolean
  ) => Promise<boolean>;
  resolveIncident: (
    incidentId: string, 
    customResolution?: { rootCause: string; actionsTaken: string[]; summary: string }
  ) => void;
  addIncident: (newIncident: {
    title: string;
    category: any;
    impactLevel: 'Low' | 'Medium' | 'High' | 'Work-Blocking';
    description: string;
    attachments?: string[];
  }) => Incident;
  submitRequest: (payload: { title: string; description: string; category_hint?: string }) => Promise<Incident | null>;
  telemetry: TelemetryEvent[];
  topologyNodes: TopologyNode[];
  operationalMemory: OperationalMemoryItem[];
  metrics: ExecutiveMetrics | null;
  refreshIncidents: () => Promise<void>;
  isRemediating: boolean;
  remediationStep: number;
  remediationLogs: string[];
  applyAutomatedFix: (incidentId: string) => Promise<void>;
  activeTab: 'triage' | 'assigned' | 'all' | 'memory';
  setActiveTab: (tab: 'triage' | 'assigned' | 'all' | 'memory') => void;
  toasts: ToastNotification[];
  addToast: (title: string, message: string, type: ToastNotification['type']) => void;
  removeToast: (id: string) => void;
  demoUsers: typeof DEMO_USERS;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:8000/api';

import { 
  useAuth, 
  STORAGE_USER, 
  STORAGE_AUTH, 
  STORAGE_TOKEN, 
  LEGACY_STORAGE_USER, 
  LEGACY_STORAGE_AUTH, 
  getStoredAuthInfo 
} from './AuthContext';

export { 
  STORAGE_USER, 
  STORAGE_AUTH, 
  STORAGE_TOKEN, 
  LEGACY_STORAGE_USER, 
  LEGACY_STORAGE_AUTH, 
  getStoredAuthInfo 
};

const normalizeIncident = (inc: any): Incident => {
  return {
    ...inc,
    id: inc.id || 'TRC-1000',
    title: inc.title || 'Untitled Incident',
    description: inc.description || '',
    category: inc.category || 'Software',
    priority: inc.priority || 'MEDIUM',
    status: inc.status || 'New',
    createdAt: inc.createdAt || inc.created_at || 'Just now',
    updatedAt: inc.updatedAt || inc.updated_at || 'Just now',
    riskAmountSAR: inc.riskAmountSAR ?? 0,
    affectedTxns: inc.affectedTxns ?? 0,
    affectedService: inc.affectedService || `${(inc.category || 'core').toLowerCase()}-service`,
    businessImpact: inc.businessImpact || (inc.riskAmountSAR ? `SAR ${inc.riskAmountSAR.toLocaleString()} estimated risk` : 'Operational Triage'),
    aiConfidence: inc.aiConfidence ?? (inc.ai_confidence ? Math.round(inc.ai_confidence * 100) : 92),
    likelyRootCause: inc.likelyRootCause || inc.ai_likely_cause || 'AI telemetry correlation active.',
    recommendedActions: inc.recommendedActions || inc.ai_fix_steps || [
      'Inspect application service logs',
      'Restart degraded service pods'
    ],
    submitter: inc.submitter || {
      name: inc.creator_name || 'Sarah Jenkins',
      email: inc.creator_email || 'sarah.jenkins@enterprise.com',
      department: inc.creator_department || 'Operations Team',
      avatar: inc.creator_avatar || '/default.png'
    },
    assignedSpecialist: inc.assignedSpecialist || (inc.assigned_to_user_id ? {
      id: inc.assigned_to_user_id,
      name: inc.assignee_name || 'Alex Vance',
      avatar: inc.assignee_avatar || '/default.png',
      role: `${inc.assignee_specialty || 'General'} Specialist`
    } : undefined)
  };
};

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const { currentPath, navigate, currentUser, isAuthenticated, login, logout } = auth;
  const [incidents, setIncidents] = useState<Incident[]>(() => INITIAL_INCIDENTS.map(normalizeIncident));
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>('TRC-1001');
  const [accessDeniedState, setAccessDeniedState] = useState<AccessDeniedState | null>(null);
  const [telemetry] = useState<TelemetryEvent[]>(TELEMETRY_TIMELINE);
  const [topologyNodes, setTopologyNodes] = useState<TopologyNode[]>(TOPOLOGY_NODES);
  const [operationalMemory, setOperationalMemory] = useState<OperationalMemoryItem[]>(OPERATIONAL_MEMORY_ITEMS);
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'triage' | 'assigned' | 'all' | 'memory'>('triage');
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [remediationStep, setRemediationStep] = useState<number>(0);
  const [remediationLogs, setRemediationLogs] = useState<string[]>([]);

  const addToast = useCallback((title: string, message: string, type: ToastNotification['type']) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: 'Just now',
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch requests from backend with RBAC headers
  const refreshIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        headers: {
          'X-User-Id': currentUser.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.requests) {
          setIncidents(data.requests.map(normalizeIncident));
        }
      }
    } catch {
      // Local fallback
      if (currentUser.role === 'employee') {
        setIncidents(INITIAL_INCIDENTS.filter(i => i.created_by_user_id === currentUser.id).map(normalizeIncident));
      } else if (currentUser.role === 'technician' || currentUser.role === 'it_member') {
        setIncidents(INITIAL_INCIDENTS.filter(i => i.assigned_to_user_id === currentUser.id).map(normalizeIncident));
      } else {
        setIncidents(INITIAL_INCIDENTS.map(normalizeIncident));
      }
    }

    if (currentUser.role === 'manager' || currentUser.role === 'specialist') {
      try {
        const mRes = await fetch(`${API_BASE}/metrics`, {
          headers: { 'X-User-Id': currentUser.id }
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          setMetrics(mData);
        }
      } catch {}
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshIncidents();
    }
  }, [currentUser, isAuthenticated, refreshIncidents]);

  const loginWithUserId = useCallback(async (credential: string, password?: string): Promise<boolean> => {
    return await login(credential, password);
  }, [login]);

  const loginAs = useCallback((role: any) => {
    if (role === 'employee') login('usr_emp_sarah');
    else if (role === 'technician' || role === 'specialist') login('usr_tech_alex');
    else if (role === 'manager') login('usr_mgr_elena');
    else login(role);
  }, [login]);

  const investigateTicket = async (incidentId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/requests/${incidentId}`, {
        headers: { 'X-User-Id': currentUser.id }
      });
      if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        setAccessDeniedState({
          resourceId: incidentId,
          reason: err.detail || `Access Denied: You do not have permission to view request ${incidentId}. Security violation recorded.`
        });
        addToast('Security Violation', 'HTTP 403 Forbidden: Access denied by RBAC policy.', 'critical');
        return false;
      }
      if (res.ok) {
        setActiveInvestigationId(incidentId);
        setAccessDeniedState(null);
        return true;
      }
    } catch {
      // Offline fallback check
    }

    if (currentUser.role === 'employee') {
      const inc = incidents.find(i => i.id === incidentId);
      if (inc && inc.created_by_user_id !== currentUser.id) {
        setAccessDeniedState({
          resourceId: incidentId,
          reason: `Access Denied: Employees can view only their own submitted requests. Request '${incidentId}' belongs to another employee.`
        });
        addToast('Security Violation', 'HTTP 403 Forbidden: Access denied by RBAC policy.', 'critical');
        return false;
      }
    } else if (currentUser.role === 'technician' || currentUser.role === 'it_member') {
      const inc = incidents.find(i => i.id === incidentId);
      if (inc && inc.assigned_to_user_id !== currentUser.id) {
        setAccessDeniedState({
          resourceId: incidentId,
          reason: `Access Denied: IT Team Members can access only requests explicitly assigned to them. Request '${incidentId}' is not assigned to you.`
        });
        addToast('Security Violation', 'HTTP 403 Forbidden: Access denied by RBAC policy.', 'critical');
        return false;
      }
    }

    setActiveInvestigationId(incidentId);
    setAccessDeniedState(null);
    return true;
  };

  const clearAccessDenied = () => {
    setAccessDeniedState(null);
  };

  const claimTicket = async (incidentId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/requests/${incidentId}/claim`, {
        method: 'POST',
        headers: {
          'X-User-Id': currentUser.id,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 403) {
        const err = await res.json();
        setAccessDeniedState({ resourceId: incidentId, reason: err.detail || 'Access Denied' });
        addToast('Security Violation', '403 Forbidden: Claim action denied by RBAC policy.', 'critical');
        return false;
      }
      if (res.ok) {
        addToast('Ticket Claimed', `You have claimed ${incidentId}. Status changed to In Progress.`, 'success');
        await refreshIncidents();
        return true;
      }
    } catch {}

    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          assigned_to_user_id: currentUser.id,
          assignedSpecialist: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: `${currentUser.specialty || 'General'} Specialist`
          },
          status: 'In Progress'
        };
      }
      return inc;
    }));
    addToast('Ticket Claimed', `You have claimed ${incidentId}. Status changed to In Progress.`, 'success');
    return true;
  };

  const assignTicket = (incidentId: string) => {
    claimTicket(incidentId);
  };

  const assignTicketTo = async (incidentId: string, technicianId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/requests/${incidentId}/assign`, {
        method: 'PATCH',
        headers: {
          'X-User-Id': currentUser.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assigned_to_user_id: technicianId })
      });
      if (res.status === 403) {
        const err = await res.json();
        setAccessDeniedState({ resourceId: incidentId, reason: err.detail || 'Access Denied' });
        addToast('Security Violation', '403 Forbidden: Only managers can reassign tickets.', 'critical');
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        addToast('Ticket Reassigned', `Ticket ${incidentId} assigned to ${data.assigned_to}.`, 'success');
        await refreshIncidents();
        return true;
      }
    } catch {}
    return false;
  };

  const updateTicketStatus = async (
    incidentId: string,
    status: string,
    note?: string,
    resolutionSummary?: string,
    saveToKb?: boolean
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/requests/${incidentId}/status`, {
        method: 'PATCH',
        headers: {
          'X-User-Id': currentUser.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          note,
          resolution_summary: resolutionSummary,
          save_to_kb: saveToKb
        })
      });
      if (res.status === 403) {
        const err = await res.json();
        setAccessDeniedState({ resourceId: incidentId, reason: err.detail || 'Access Denied' });
        addToast('Security Violation', '403 Forbidden: Cannot update status on tickets not assigned to you.', 'critical');
        return false;
      }
      if (res.ok) {
        addToast('Status Updated', `Ticket ${incidentId} is now ${status}.`, 'info');
        await refreshIncidents();
        return true;
      }
    } catch {}

    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: status as any,
          resolution_summary: resolutionSummary || inc.resolution_summary
        };
      }
      return inc;
    }));
    addToast('Status Updated', `Ticket ${incidentId} is now ${status}.`, 'info');
    return true;
  };

  const resolveIncident = (
    incidentId: string,
    customResolution?: { rootCause: string; actionsTaken: string[]; summary: string }
  ) => {
    updateTicketStatus(
      incidentId,
      'Resolved',
      undefined,
      customResolution?.summary || 'Resolved by IT Specialist',
      true
    );
  };

  const submitRequest = async (payload: { title: string; description: string; category_hint?: string }): Promise<Incident | null> => {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: {
          'X-User-Id': currentUser.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeIncident(data.request);
        addToast('Request Submitted', `Incident ${normalized.id} created and analyzed by AI.`, 'success');
        await refreshIncidents();
        return normalized;
      }
    } catch {}

    const newId = `TRC-${1000 + incidents.length + 1}`;
    const newIncident: Incident = normalizeIncident({
      id: newId,
      title: payload.title,
      description: payload.description,
      category: payload.category_hint || 'Software',
      priority: 'HIGH',
      status: 'AI Suggested',
      created_by_user_id: currentUser.id,
      creator_name: currentUser.name,
      creator_email: currentUser.email,
      creator_department: currentUser.department,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_confidence: 0.88,
      ai_likely_cause: 'Ingress connection bottleneck or token invalidation.',
      ai_fix_steps: [
        'Clear browser/local cache and restart active session',
        'Verify SSO token expiration in identity provider',
        'Renew authentication credentials'
      ],
      ai_is_complex: false,
      ai_technician_summary: `Submitted by ${currentUser.name}. Automated self-resolution suggestions generated.`
    });

    setIncidents(prev => [newIncident, ...prev]);
    addToast('Request Submitted', `Incident ${newId} created. AI triage suggestions ready.`, 'success');
    return newIncident;
  };

  const addIncident = (newIncidentData: {
    title: string;
    category: any;
    impactLevel: 'Low' | 'Medium' | 'High' | 'Work-Blocking';
    description: string;
    attachments?: string[];
  }): Incident => {
    const nextIdNum = 1000 + incidents.length + Math.floor(Math.random() * 50) + 1;
    const newId = `#TRC-${nextIdNum}`;

    let priority: Priority = 'MEDIUM';
    let riskSAR = 25000;
    let affectedTxns = 150;
    let impactText = 'Standard Service Disruption';

    if (newIncidentData.impactLevel === 'Work-Blocking') {
      priority = 'CRITICAL';
      riskSAR = 650000;
      affectedTxns = 8400;
      impactText = 'Severe Revenue Block — Urgent Triage';
    } else if (newIncidentData.impactLevel === 'High') {
      priority = 'HIGH';
      riskSAR = 180000;
      affectedTxns = 2100;
      impactText = 'High Operational Friction';
    } else if (newIncidentData.impactLevel === 'Low') {
      priority = 'LOW';
      riskSAR = 5000;
      affectedTxns = 0;
      impactText = 'Minor localized issue';
    }

    const createdIncident: Incident = normalizeIncident({
      id: newId,
      title: newIncidentData.title,
      affectedService: `${String(newIncidentData.category).toLowerCase().replace(/[^a-z0-9]/g, '-')}-service`,
      category: newIncidentData.category,
      priority,
      status: 'Submitted',
      submitter: {
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department,
        avatar: currentUser.avatar,
      },
      createdAt: 'Just now',
      updatedAt: 'Just now',
      description: newIncidentData.description,
      impactLevel: newIncidentData.impactLevel,
      businessImpact: impactText,
      riskAmountSAR: riskSAR,
      affectedTxns,
      attachments: newIncidentData.attachments || [],
      aiConfidence: 94,
      likelyRootCause: `Automated analysis queued for ${newIncidentData.title}. Telemetry indicates ingress bottleneck.`,
      recommendedActions: [
        'Initiate synthetic health probes on affected cluster endpoints.',
        'Review recent deployment commits in target namespace.',
      ],
    });

    setIncidents((prev) => [createdIncident, ...prev]);

    addToast(
      'New Incident Created',
      `Ticket ${newId} submitted and synchronized to NOC Command Center queue.`,
      priority === 'CRITICAL' ? 'critical' : 'success'
    );

    return createdIncident;
  };

  const applyAutomatedFix = async (incidentId: string) => {
    setIsRemediating(true);
    setRemediationStep(1);
    setRemediationLogs(['Initiating automated remediation pipeline...']);

    await new Promise((r) => setTimeout(r, 1200));
    setRemediationLogs((prev) => [
      ...prev,
      'Executing runbook #RB-DB-4819: Terminating PID #4819 unindexed batch query on primary database writer...',
    ]);
    setRemediationStep(2);

    await new Promise((r) => setTimeout(r, 1500));
    setRemediationLogs((prev) => [
      ...prev,
      'Patching RDS pool parameter max_connections: 100 -> 300 (Applied dynamically without downtime).',
    ]);
    setRemediationStep(3);

    await new Promise((r) => setTimeout(r, 1400));
    setRemediationLogs((prev) => [
      ...prev,
      'Validating telemetry recovery: Payment API p99 latency dropped from 4,820ms to 48ms.',
      'Active database connections dropped to 34/300 (Healthy).',
      'Remediation verified! Updating ticket status to Resolved.',
    ]);

    setTopologyNodes((prev) =>
      prev.map((n) => {
        if (n.id === 'node-db' || n.id === 'node-payment' || n.id === 'node-redis') {
          return {
            ...n,
            status: 'healthy',
            latency: '42ms',
            errorRate: '0.01%',
            connections: '34/300 (Nominal)',
          };
        }
        return n;
      })
    );

    const postMortem = {
      summary: 'Automated remediation triggered via TRACE AI. Terminated runaway unindexed query PID #4819 and scaled DB connection pool to 300.',
      rootCause: 'Unindexed batch query on txn_ledger triggered database connection exhaustion.',
      preventionSteps: [
        'Enforce static query analysis in CI/CD pipeline to block unindexed FOR UPDATE queries.',
        'Automate connection pool autoscaling on PostgreSQL instances.',
      ],
      resolvedAt: new Date().toISOString(),
      resolvedBy: `${currentUser.name} (AI Assisted)`,
      mttrMinutes: 14,
      actionsTaken: [
        'Killed long-running query PID #4819',
        'Increased RDS pool limit to 300',
        'Verified latency drop back to baseline 48ms',
      ],
    };

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: 'Resolved',
            updatedAt: 'Just now',
            postMortem,
          };
        }
        return inc;
      })
    );

    // Add to operational memory
    const newMemoryItem: OperationalMemoryItem = {
      id: `KB-${Math.floor(100 + Math.random() * 900)}`,
      incidentId,
      title: 'Payment Gateway Connection Timeout & DB Pool Saturation',
      matchPercentage: 99,
      resolvedDaysAgo: 0,
      category: 'Software',
      service: 'checkout-gateway-prod',
      rootCause: postMortem.rootCause,
      resolutionSteps: postMortem.actionsTaken,
      resolvedBy: currentUser.name,
      resolvedDate: 'Just now',
      mttr: '14 minutes',
      tags: ['AutomatedRemediation', 'PostgreSQL', 'PaymentGateway'],
      financialSavedSAR: 850000,
    };

    setOperationalMemory((prev) => [newMemoryItem, ...prev]);

    setIsRemediating(false);
    addToast(
      'Remediation Succeeded',
      `Incident ${incidentId} resolved automatically. Operational memory updated!`,
      'success'
    );
  };

  return (
    <IncidentContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        isAuthenticated,
        currentPath,
        navigate,
        loginWithUserId,
        loginAs,
        logout,
        incidents,
        activeInvestigationId,
        setActiveInvestigationId,
        investigateTicket,
        accessDeniedState,
        clearAccessDenied,
        claimTicket,
        assignTicket,
        assignTicketTo,
        updateTicketStatus,
        resolveIncident,
        addIncident,
        submitRequest,
        telemetry,
        topologyNodes,
        operationalMemory,
        metrics,
        refreshIncidents,
        isRemediating,
        remediationStep,
        remediationLogs,
        applyAutomatedFix,
        activeTab,
        setActiveTab,
        toasts,
        addToast,
        removeToast,
        demoUsers: DEMO_USERS,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncident = (): IncidentContextType => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncident must be used within an IncidentProvider');
  }
  return context;
};
