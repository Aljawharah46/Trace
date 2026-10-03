export type UserRole = 'employee' | 'technician' | 'manager' | 'specialist' | 'it_member' | 'it_head';

export type Specialty = 'Network' | 'Software' | 'Hardware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialty?: Specialty | null;
  avatar: string;
  title?: string;
  department: string;
}

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 
  | 'New'
  | 'AI Suggested'
  | 'Resolved by AI'
  | 'Resolved Instantly'
  | 'Escalated'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Submitted'
  | 'Under Review';

export type Category = 
  | 'Network' 
  | 'Software' 
  | 'Hardware' 
  | 'Payment System' 
  | 'Network/VPN' 
  | 'Software Access' 
  | 'Cloud Infrastructure' 
  | 'Database & Storage' 
  | 'Security & IAM';

export interface TechnicianNote {
  timestamp: string;
  author: string;
  note: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: IncidentStatus;
  created_by_user_id?: string;
  assigned_to_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt: string;
  updatedAt: string;
  
  // Submitter / Creator info
  submitter: {
    name: string;
    email: string;
    department: string;
    avatar: string;
  };
  creator_name?: string;
  creator_email?: string;
  creator_department?: string;
  creator_avatar?: string;

  // Assignee / Specialist info
  assignedSpecialist?: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  assignee_name?: string;
  assignee_email?: string;
  assignee_specialty?: Specialty | null;
  assignee_avatar?: string;

  // AI & Triage fields
  ai_confidence?: number;
  aiConfidence: number;
  ai_likely_cause?: string;
  likelyRootCause: string;
  ai_fix_steps?: string[];
  recommendedActions: string[];
  ai_is_complex?: boolean | number;
  ai_technician_summary?: string;
  technician_notes?: TechnicianNote[];
  resolution_summary?: string;
  saved_to_kb?: boolean | number;

  // Telemetry & metrics fields
  affectedService: string;
  riskAmountSAR: number;
  affectedTxns: number;
  businessImpact?: string;
  impactLevel?: 'Low' | 'Medium' | 'High' | 'Work-Blocking';
  attachments?: string[];

  // TRACE Ticket Dataset Imported Fields
  trace_record_id?: string;
  original_problem?: string;
  trace_category?: string;
  demo_resolution?: string;
  source_ticket_id?: string;
  source_split?: string;
  resolution_source?: string;
  data_note?: string;

  operationalMemoryMatch?: {
    incidentId: string;
    similarityScore: number;
    resolvedDaysAgo: number;
    resolvedBy: string;
    summary: string;
  };

  postMortem?: {
    summary: string;
    rootCause: string;
    preventionSteps: string[];
    resolvedAt: string;
    resolvedBy: string;
    mttrMinutes: number;
    actionsTaken: string[];
  };
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  timeOffset: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  service: string;
  metric: string;
  message: string;
  badge?: string;
}

export interface TopologyNode {
  id: string;
  name: string;
  serviceKey: string;
  type: 'client' | 'gateway' | 'service' | 'database' | 'cache' | 'broker';
  status: 'healthy' | 'degraded' | 'critical' | 'recovering';
  latency: string;
  errorRate: string;
  throughput: string;
  connections: string;
  cpuUsage: string;
  memoryUsage: string;
  details: string;
  x: number;
  y: number;
}

export interface OperationalMemoryItem {
  id: string;
  incidentId: string;
  title: string;
  description?: string;
  matchPercentage?: number;
  resolvedDaysAgo?: number;
  category: Category;
  service: string;
  root_cause?: string;
  rootCause: string;
  resolution_steps?: string;
  resolutionSteps: string[];
  resolved_by?: string;
  resolvedBy: string;
  resolved_at?: string;
  resolvedDate: string;
  source?: string;
  mttr: string;
  tags: string[];
  financialSavedSAR?: number;
}

export interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  isReport?: boolean;
  metadata?: {
    title?: string;
    badge?: string;
    actions?: string[];
  };
}

export interface ExecutiveMetrics {
  total_requests: number;
  resolved_total: number;
  resolved_by_ai: number;
  ai_self_resolution_rate: number;
  unassigned_queue: number;
  critical_incidents: number;
  average_resolution_time_minutes: number;
  categories: Record<string, number>;
  technicians_workload: Array<{
    id: string;
    name: string;
    specialty: Specialty;
    avatar: string;
    active_tickets: number;
  }>;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  user_id?: string;
  user_role?: string;
  action: string;
  resource_id?: string;
  details?: string;
  status_code: number;
  ip_address?: string;
}
