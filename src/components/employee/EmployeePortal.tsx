import React, { useState, useRef, useEffect } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { 
  Sparkles, 
  Send, 
  ArrowUp, 
  ShieldCheck, 
  CheckCircle2, 
  Ticket, 
  Cpu, 
  Check, 
  MessageSquare,
  PanelLeft,
  ArrowLeft,
  Search,
  Calendar,
  UserCheck
} from 'lucide-react';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeProfileView } from './EmployeeProfileView';
import { MarkdownMessage } from '../common/MarkdownMessage';
import { Incident } from '../../types';

interface TriageData {
  category: string;
  priority: string;
  likely_cause: string;
  fix_steps: string[];
  confidence: number;
  is_complex: boolean;
  technician_summary: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  statusMessage?: string;
  isStreaming?: boolean;
  triage?: TriageData;
  piiDetected?: string[];
  ticketCreatedId?: string;
  isResolved?: boolean;
}

const QUICK_PROMPTS = [
  'Cannot connect to corporate VPN from Dubai branch, getting Error 800',
  'OAuth 2.0 / Okta SAML service intermittent 502 Bad Gateway',
  'Workstation dual monitor DisplayPort flickering on Thunderbolt dock',
  'Docker daemon socket permission denied on macOS IT workstation'
];

const API_BASE = 'http://127.0.0.1:8000/api';

interface EmployeePortalProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  isSidebarOpen: externalIsSidebarOpen,
  onToggleSidebar: externalOnToggleSidebar,
  onCloseSidebar: externalOnCloseSidebar,
}) => {
  const { currentUser, addToast, refreshIncidents, incidents } = useIncident();
  const employeeFirstName = currentUser?.name ? currentUser.name.trim().split(' ')[0] : '';
  
  // Sidebar State (controlled or internal fallback)
  const [internalIsSidebarOpen, setInternalIsSidebarOpen] = useState<boolean>(false);
  const isSidebarOpen = externalIsSidebarOpen !== undefined ? externalIsSidebarOpen : internalIsSidebarOpen;
  const toggleSidebar = externalOnToggleSidebar || (() => setInternalIsSidebarOpen(prev => !prev));
  const closeSidebar = externalOnCloseSidebar || (() => setInternalIsSidebarOpen(false));

  // Portal active view: 'chat' | 'history' | 'notifications' | 'profile'
  const [activePortalView, setActivePortalView] = useState<'chat' | 'history' | 'notifications' | 'profile'>('chat');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');

  // View state: false = Initial Google-Style Landing, true = Conversational Chat View
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [completedSteps, setCompletedSteps] = useState<{ [msgId: string]: number[] }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (hasStartedChat) {
      scrollToBottom();
    }
  }, [messages, hasStartedChat]);

  // Focus input when chat starts
  useEffect(() => {
    if (hasStartedChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasStartedChat]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isSubmitting) return;

    setInputText('');
    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Track whether a structured triage card has already been provided or prior user messages exist
    const hasTriage = messages.some((m) => !!m.triage);
    const hasPriorUserMsg = messages.some((m) => m.sender === 'user');
    const isFirstMessage = !hasTriage && !hasPriorUserMsg;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: timeStr
    };

    const aiMsgId = `ai-${Date.now() + 1}`;
    const aiPlaceholder: ChatMessage = {
      id: aiMsgId,
      sender: 'assistant',
      text: '',
      timestamp: timeStr,
      statusMessage: isFirstMessage
        ? 'Analyzing operational telemetry with Gemini 2.5 Flash...'
        : 'Consulting TRACE AI Assistant...',
      isStreaming: true
    };

    // Transition view immediately into conversational chat
    setHasStartedChat(true);
    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);

    // Build rich multi-turn conversation history for Gemini context
    const conversationHistory = messages
      .filter((m) => m.text && !m.isStreaming)
      .map((m) => {
        let content = m.text;
        if (m.sender === 'assistant' && m.triage) {
          content = `[Initial Triage Analysis]\nLikely Root Cause: ${m.triage.likely_cause}\nCategory: ${m.triage.category}\nFix Steps:\n${m.triage.fix_steps?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        }
        return {
          role: m.sender,
          content: content
        };
      });

    try {
      // Stream AI response using Server-Sent Events endpoint
      const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({
          message: query,
          is_first_message: isFirstMessage,
          mode: isFirstMessage ? 'triage' : 'chat',
          history: conversationHistory
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed, invoking fallback endpoint');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const data = JSON.parse(trimmed.replace('data:', '').trim());
              
              if (data.type === 'status') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, statusMessage: data.content } : msg
                  )
                );
              } else if (data.type === 'triage' && data.triage) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          text: `I've analyzed your telemetry regarding "${data.cleaned_message}". Here is the automated triage analysis and recommended self-resolution runbook:`,
                          triage: data.triage,
                          piiDetected: data.pii_detected,
                          isStreaming: false,
                          statusMessage: undefined
                        }
                      : msg
                  )
                );
              } else if (data.chat_response || data.type === 'chat_response' || data.type === 'text' || data.type === 'chat') {
                const responseContent = data.chat_response || data.content || data.reply || '';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          text: responseContent,
                          triage: undefined,
                          piiDetected: data.pii_detected,
                          isStreaming: false,
                          statusMessage: undefined
                        }
                      : msg
                  )
                );
              } else if (data.type === 'done') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, isStreaming: false, statusMessage: undefined } : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON parses
            }
          }
        }
      }
    } catch {
      // Resilient fallback to standard JSON endpoint
      try {
        const res = await fetch('http://127.0.0.1:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id
          },
          body: JSON.stringify({
            message: query,
            is_first_message: isFirstMessage,
            mode: isFirstMessage ? 'triage' : 'chat',
            history: conversationHistory
          })
        });
        const data = await res.json();
        const chatReply = data.chat_response || (data.triage ? undefined : data.reply);

        if (chatReply) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: chatReply,
                    triage: undefined,
                    piiDetected: data.pii_detected,
                    isStreaming: false,
                    statusMessage: undefined
                  }
                : msg
            )
          );
        } else if (data.triage) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: data.reply || `Diagnostic completed for: "${query}".`,
                    triage: data.triage,
                    piiDetected: data.pii_detected,
                    isStreaming: false,
                    statusMessage: undefined
                  }
                : msg
            )
          );
        }
      } catch {
        // Offline / disconnected mock
        if (isFirstMessage) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: 'Operational diagnostic performed. Self-resolution protocol initialized.',
                    triage: {
                      category: 'Software',
                      priority: 'MEDIUM',
                      likely_cause: 'Session state timeout or transient client cache desynchronization.',
                      fix_steps: [
                        'Perform a hard refresh in your browser (Ctrl+Shift+R or Cmd+Shift+R).',
                        'Clear application cookies and cached site tokens.',
                        'Re-authenticate via Enterprise SSO.'
                      ],
                      confidence: 0.88,
                      is_complex: false,
                      technician_summary: 'Software issue evaluated. Standard remediation protocol advised.'
                    },
                    isStreaming: false,
                    statusMessage: undefined
                  }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: `Thanks for the update: "${query}". If the troubleshooting step did not resolve the problem, you can click 'Still Need Help? Create Support Ticket' on the triage card above to route this to an IT specialist.`,
                    triage: undefined,
                    isStreaming: false,
                    statusMessage: undefined
                  }
                : msg
            )
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepToggle = (msgId: string, stepIndex: number) => {
    setCompletedSteps((prev) => {
      const current = prev[msgId] || [];
      if (current.includes(stepIndex)) {
        return { ...prev, [msgId]: current.filter((idx) => idx !== stepIndex) };
      } else {
        return { ...prev, [msgId]: [...current, stepIndex] };
      }
    });
  };

  const handleResolveIssue = async (msgId: string) => {
    // 1. Mark as resolved locally
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, isResolved: true } : msg
      )
    );

    const targetMsg = messages.find((m) => m.id === msgId);
    const userFirstMsg = messages.find((m) => m.sender === 'user')?.text || 'Resolved technical problem';

    // 2. Automatically save active session to database as "Resolved Instantly"
    try {
      const payload = {
        title: targetMsg?.triage?.likely_cause || userFirstMsg.slice(0, 60),
        description: userFirstMsg,
        category: targetMsg?.triage?.category || 'Software',
        priority: targetMsg?.triage?.priority || 'MEDIUM',
        status: 'Resolved Instantly',
        likely_cause: targetMsg?.triage?.likely_cause || userFirstMsg,
        fix_steps: targetMsg?.triage?.fix_steps || [],
        confidence: targetMsg?.triage?.confidence ?? 0.95,
        is_complex: false,
        technician_summary: 'Self-resolved instantly on the spot by employee via TRACE AI remediation steps.'
      };

      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const createdId = data.ticket_id || data.id;
        if (createdId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === msgId ? { ...msg, ticketCreatedId: createdId } : msg
            )
          );
        }
        await refreshIncidents();
        addToast('Issue Resolved', 'Saved as Resolved Instantly in your history.', 'success');
      } else {
        addToast('Issue Resolved', 'Marked as successfully resolved.', 'success');
      }
    } catch (err) {
      console.error('[TRACE AI] Error saving resolved session to history:', err);
      addToast('Issue Resolved', 'Marked as successfully resolved.', 'success');
    }
  };

  const handleCreateTicketFromChat = async (msg: ChatMessage) => {
    if (!msg.triage) {
      console.warn('[TRACE AI] Cannot raise ticket: No triage analysis present on message', msg);
      addToast('Cannot Create Ticket', 'AI triage diagnostic data is missing for this message.', 'warning');
      return;
    }

    const payload = {
      title: msg.triage.likely_cause || msg.text.slice(0, 60) || 'IT Incident Report',
      description: msg.text,
      category: msg.triage.category,
      priority: msg.triage.priority,
      likely_cause: msg.triage.likely_cause,
      fix_steps: msg.triage.fix_steps || [],
      confidence: msg.triage.confidence ?? 0.85,
      is_complex: Boolean(msg.triage.is_complex),
      technician_summary: msg.triage.technician_summary || 'Dispatched via TRACE AI Chat'
    };

    const targetUrl = `${API_BASE}/requests`;
    console.log('[TRACE AI] Submitting ticket to backend...', {
      url: targetUrl,
      userId: currentUser.id,
      userRole: currentUser.role,
      payload
    });

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify(payload)
      });

      console.log(`[TRACE AI] Backend response: status=${res.status} (${res.statusText})`);

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          console.error('[TRACE AI] Backend error response payload:', errData);
          if (errData.detail) {
            if (typeof errData.detail === 'string') {
              errMessage = errData.detail;
            } else if (Array.isArray(errData.detail)) {
              // FastAPI 422 validation error
              errMessage = errData.detail
                .map((d: any) => `${d.loc ? d.loc.join('.') : 'field'}: ${d.msg}`)
                .join(', ');
            }
          }
        } catch {
          const rawText = await res.text().catch(() => '');
          console.error('[TRACE AI] Backend raw non-JSON error response:', rawText);
          if (rawText) errMessage = rawText;
        }

        addToast(
          'Ticket Creation Failed',
          `Server error (${res.status}): ${errMessage}`,
          'critical'
        );
        return;
      }

      const data = await res.json();
      console.log('[TRACE AI] Ticket created successfully:', data);

      const ticketId = data.ticket_id || data.id || data.request?.id || 'TRC-NEW';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, ticketCreatedId: ticketId } : m
        )
      );

      addToast(
        'Official Ticket Created!',
        `Assigned Ticket ID ${ticketId}. Dispatched to ${msg.triage.category} Specialist.`,
        'success'
      );

      await refreshIncidents();
    } catch (networkError: any) {
      console.error('[TRACE AI] Network / CORS error while dispatching ticket:', networkError);
      addToast(
        'Ticket Creation Failed',
        `Network / CORS error: ${networkError?.message || 'Could not connect to FastAPI server at ' + API_BASE}`,
        'critical'
      );
    }
  };

  // Action: New Chat (Start a fresh AI triage session immediately)
  const handleNewChat = () => {
    setMessages([]);
    setHasStartedChat(false);
    setInputText('');
    setCompletedSteps({});
    setActivePortalView('chat');
    setIsSubmitting(false);
    addToast('New Chat Session', 'Started fresh AI triage session', 'info');
  };

  // Filter tickets filed exclusively by currently logged-in employee (filtering out other users' data)
  const employeeHistoryTickets = incidents.filter(
    (inc) =>
      inc.created_by_user_id === currentUser.id ||
      inc.creator_email === currentUser.email ||
      inc.submitter?.email === currentUser.email
  );

  const filteredHistoryTickets = employeeHistoryTickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    (ticket.category && ticket.category.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
    (ticket.trace_category && ticket.trace_category.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
    (ticket.original_problem && ticket.original_problem.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
    (ticket.demo_resolution && ticket.demo_resolution.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
    (ticket.resolution_summary && ticket.resolution_summary.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
    (ticket.likelyRootCause && ticket.likelyRootCause.toLowerCase().includes(historySearchTerm.toLowerCase()))
  );

  // Helper to format ticket date cleanly: strictly displays only the date/time
  const formatTicketDate = (ticket: Incident) => {
    const isoDate = ticket.created_at || ticket.updated_at;
    if (isoDate) {
      const parsed = Date.parse(isoDate);
      if (!isNaN(parsed)) {
        return new Date(parsed).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    return ticket.createdAt || ticket.updatedAt || 'Recent';
  };

  // Action: Select ticket from history to reload specific past chat session into main screen view
  const handleSelectTicket = (ticket: Incident) => {
    setActivePortalView('chat');
    setHasStartedChat(true);

    const isInstant = ticket.status === 'Resolved Instantly';
    const isResolved = isInstant || ticket.status === 'Resolved' || ticket.status === 'Resolved by AI';

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: ticket.original_problem || ticket.description || ticket.title,
      timestamp: formatTicketDate(ticket)
    };

    const aiMsgId = `ai-${Date.now() + 1}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'assistant',
      text: `Historical session for **${ticket.id}**: "${ticket.title}".\nLive Status: **${ticket.status}**`,
      timestamp: formatTicketDate(ticket),
      ticketCreatedId: ticket.id,
      isResolved: isResolved,
      triage: {
        category: ticket.category,
        priority: ticket.priority,
        likely_cause: ticket.likelyRootCause || ticket.ai_likely_cause || ticket.title,
        fix_steps: ticket.recommendedActions && ticket.recommendedActions.length > 0
          ? ticket.recommendedActions
          : (ticket.demo_resolution ? [ticket.demo_resolution] : (ticket.ai_fix_steps || ['Diagnostic telemetry validated'])),
        confidence: ticket.aiConfidence || 94,
        is_complex: !!ticket.ai_is_complex,
        technician_summary: ticket.ai_technician_summary || (ticket.trace_category ? `Incident classified under ${ticket.trace_category}.` : 'Historical triage session')
      }
    };

    setMessages([userMsg, aiMsg]);
  };

  const resetChat = () => {
    handleNewChat();
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] w-full bg-[#0F1319] text-[#F8F7F8] flex flex-col font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          EMPLOYEE COLLAPSIBLE DRAWER SIDEBAR
      ────────────────────────────────────────────────────────────── */}
      <EmployeeSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        activeView={activePortalView}
        onNavigate={(view) => setActivePortalView(view)}
        onNewChat={handleNewChat}
        onSelectTicket={handleSelectTicket}
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
        <EmployeeProfileView onBack={() => setActivePortalView('chat')} />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW B: DEDICATED TICKET HISTORY VIEW
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'history' && (
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivePortalView('chat')}
                type="button"
                className="p-2 rounded-xl bg-[#101828] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer shadow-sm"
                title="Back to Chat"
              >
                <ArrowLeft className="w-4 h-4 text-[#80A6D7]" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Resolved Problems History
                </h1>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] text-[#0F1319] font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Start New Request
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
          {filteredHistoryTickets.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-[#101828] border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No Resolved Problems Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No resolved incidents or technical requests match your search criteria. Only resolved issues appear in history.
              </p>
              <button
                onClick={handleNewChat}
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-[#80A6D7] text-[#0F1319] font-bold text-xs cursor-pointer hover:bg-[#97bbed] transition-colors"
              >
                Report New Issue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredHistoryTickets.map((ticket) => {
                const isAI = ticket.status === 'Resolved by AI' || (!ticket.assigned_to_user_id && !ticket.assignedSpecialist && !ticket.assignee_name);
                const specialistName = ticket.assignedSpecialist?.name || ticket.assignee_name || 'IT Specialist';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className="rounded-2xl sm:rounded-3xl bg-[#101828] border border-slate-700/80 hover:border-slate-500 p-5 sm:p-6 flex flex-col justify-between transition-all shadow-xl text-left group cursor-pointer hover:shadow-2xl hover:shadow-black/50"
                    title="Click to review full incident context in AI Assistant"
                  >
                    <div>
                      {/* Top Header: ID + Prominent Resolution Badge (Category and Priority removed for employees) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#80A6D7] bg-[#80A6D7]/10 px-2.5 py-0.5 rounded-lg border border-[#80A6D7]/20">
                            {ticket.id}
                          </span>
                          {ticket.trace_category && (
                            <span className="text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
                              {ticket.trace_category}
                            </span>
                          )}
                        </div>

                        {/* Prominent Resolution Indicator: Live Status Tracking */}
                        {ticket.status === 'Resolved Instantly' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/10">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resolved Instantly</span>
                          </div>
                        ) : ticket.status === 'Resolved' || ticket.status === 'Resolved by AI' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/10">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resolved by AI</span>
                          </div>
                        ) : ticket.status === 'In Progress' || ticket.status === 'Assigned' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/35 text-amber-300 shadow-sm shadow-amber-500/10">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span>{ticket.status}</span>
                          </div>
                        ) : ticket.status === 'Escalated' || ticket.status === 'Submitted' || ticket.status === 'New' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/35 text-blue-300 shadow-sm shadow-blue-500/10">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span>{ticket.status === 'Submitted' ? 'Submitted to IT' : ticket.status}</span>
                          </div>
                        ) : isAI ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/10">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resolved Instantly</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/35 text-blue-300 shadow-sm shadow-blue-500/10">
                            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Resolved by IT Team</span>
                          </div>
                        )}
                      </div>

                      {/* Problem Title */}
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#80A6D7] transition-colors leading-snug">
                        {ticket.title}
                      </h3>

                      {/* Problem Description */}
                      <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                        {ticket.description}
                      </p>

                      {/* Resolution Box: Clean container with no sentence background highlights */}
                      <div className="mt-4 rounded-xl p-4 bg-slate-900/50 border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span className={`flex items-center gap-1.5 ${ticket.status === 'Resolved Instantly' || isAI ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {ticket.status === 'Resolved Instantly' ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Instant AI Auto-Remediation</span>
                              </>
                            ) : isAI ? (
                              <>
                                <Cpu className="w-3.5 h-3.5" />
                                <span>Autonomous AI Remediation</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Remediated by IT Team</span>
                              </>
                            )}
                          </span>
                          {!isAI && ticket.status !== 'Resolved Instantly' && (
                            <span className="text-[10px] font-medium text-slate-400">
                              Specialist: {specialistName}
                            </span>
                          )}
                        </div>

                        {/* Root Cause Details */}
                        <div className="text-xs text-slate-300 leading-relaxed">
                          <span className="text-slate-400 font-medium">Root Cause: </span>
                          <span>{ticket.likelyRootCause || ticket.ai_likely_cause || 'Identified via telemetry inspection.'}</span>
                        </div>

                        {/* Resolution Summary: Clean text, no background highlight */}
                        <div className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                          <span className="font-semibold text-slate-300">Resolution Summary: </span>
                          <span>
                            {ticket.resolution_summary ||
                              (ticket.technician_notes && ticket.technician_notes.length > 0
                                ? ticket.technician_notes[ticket.technician_notes.length - 1].note
                                : 'Action completed and operational verification confirmed.')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: LEAVE THE DATE ONLY */}
                    <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{formatTicketDate(ticket)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW C: DEDICATED NOTIFICATIONS VIEW
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'notifications' && (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivePortalView('chat')}
                type="button"
                className="p-2 rounded-xl bg-[#101828] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer shadow-sm"
                title="Back to Chat"
              >
                <ArrowLeft className="w-4 h-4 text-[#80A6D7]" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Notifications
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Platform updates and status alerts for your tickets
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#101828] border border-cyan-500/30 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">
                  AI Auto-Remediation Succeeded
                </span>
                <span className="text-[10px] font-mono text-slate-500">15 mins ago</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                WireGuard MTU fragmentation script was auto-applied. Ticket TRC-1007 was marked as Resolved Instantly.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#101828] border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">
                  Ticket Assigned to Specialist
                </span>
                <span className="text-[10px] font-mono text-slate-500">1 hour ago</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Faisal Alharbi (Software Specialist) has been assigned to investigate your OAuth 2.0 gateway issue (TRC-1002).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#101828] border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">
                  Riyadh DC-1 Gateway Health Alert
                </span>
                <span className="text-[10px] font-mono text-slate-500">2 hours ago</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Edge routing BGP route flap has been mitigated. Primary gateway latency returned to baseline (18ms).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW D: AI CHAT TRIAGE (Landing or Conversational Mode)
      ────────────────────────────────────────────────────────────── */}
      {activePortalView === 'chat' && (
        <>
          {/* MODE A: INITIAL GOOGLE-STYLE LANDING PAGE */}
          {!hasStartedChat ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
          
          {/* Main Corporate Logo: main-logo1.png centered prominently with clean transparent background */}
          <div className="flex flex-col items-center text-center w-full mb-8">
            <div className="relative mb-6 group cursor-default">
              <div className="absolute -inset-6 bg-gradient-to-r from-[#80A6D7]/15 via-[#80A6D7]/25 to-[#80A6D7]/15 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <img
                src="/main-logo1.png"
                alt="TRACE Logo"
                className="relative h-16 sm:h-20 w-auto object-contain select-none bg-transparent"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/main-logo.png';
                }}
              />
            </div>

            <h1 
              className="font-serif font-serif-elegant text-xl sm:text-2xl md:text-3xl font-normal text-[#F8F7F8] tracking-normal leading-relaxed sm:leading-[1.7] text-center max-w-2xl px-2 my-3"
              style={{ fontFamily: "'Merriweather', 'Georgia', 'Playfair Display', Cambria, 'Times New Roman', serif" }}
            >
              {employeeFirstName ? `How can I help you today, ${employeeFirstName}?` : 'How can I help you today?'}
            </h1>
          </div>

          {/* Clean Centered Dark-Mode Search / Prompt Input Bar */}
          <div className="w-full max-w-2xl mb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-[#101828] border border-slate-700/80 hover:border-slate-500 focus-within:border-[#80A6D7] focus-within:ring-2 focus-within:ring-[#80A6D7]/20 rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all duration-200"
            >
              <div className="pl-3 pr-2 text-[#80A6D7]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Describe your IT issue, paste an error code, or ask for help..."
                className="flex-1 bg-transparent text-sm text-[#F8F7F8] placeholder-slate-500 focus:outline-none px-2 py-1 font-sans"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className="w-10 h-10 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F1319] flex items-center justify-center font-bold shadow-md transition-all active:scale-95 cursor-pointer ml-2"
                title="Send to TRACE AI"
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] font-mono text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected by Zero-Trust PII Scrubbing • Passwords & Tokens Auto-Redacted</span>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="w-full max-w-2xl mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left p-3 rounded-xl bg-[#101828]/80 hover:bg-[#1E293B] border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group shadow-sm flex items-start gap-2.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#80A6D7] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            MODE B: DYNAMIC CONVERSATIONAL CHAT INTERFACE
        ────────────────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
          
          {/* Top Bar Inside Chat: Only New Chat option, TRACE AI Sentinel and bottom border line removed */}
          <div className="flex items-center justify-end py-2.5 mb-4 bg-[#0F1319]/90 backdrop-blur sticky top-16 z-20">
            <button
              onClick={resetChat}
              type="button"
              className="flex items-center px-3.5 py-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              <span>+ New Chat</span>
            </button>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-28">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Bot Avatar */}
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-slate-700 flex items-center justify-center text-[#80A6D7] shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {/* Message Content Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-xl ${
                    msg.sender === 'user'
                      ? 'bg-[#1E293B] border border-slate-700/80 text-white rounded-tr-sm'
                      : 'bg-[#101828] border border-slate-700/80 text-slate-200 rounded-tl-sm w-full'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-800/60 text-[11px] font-mono text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {msg.sender === 'user' ? currentUser.name : 'TRACE AI Operations'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* User Message Text */}
                  {msg.sender === 'user' && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.text}
                    </p>
                  )}

                  {/* Assistant Streaming Status Indicator */}
                  {msg.sender === 'assistant' && msg.isStreaming && (
                    <div className="flex items-center gap-3 py-3 text-xs font-mono text-[#80A6D7]">
                      <div className="w-4 h-4 rounded-full border-2 border-[#80A6D7] border-t-transparent animate-spin shrink-0" />
                      <span>{msg.statusMessage || 'Analyzing incident telemetry & generating root-cause...'}</span>
                    </div>
                  )}

                  {/* Assistant Response & Structured Triage Card */}
                  {msg.sender === 'assistant' && msg.triage && (
                    <div className="space-y-3.5">
                      
                      {/* Main Message Text (Proper Markdown Formatting) */}
                      <MarkdownMessage content={msg.text} />

                      {/* Technical Root-Cause: Clean text, no background highlight box */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/60">
                        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-slate-400" />
                          <span>Technical Root Cause:</span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          {msg.triage.likely_cause}
                        </p>
                      </div>

                      {/* Interactive Step-by-Step Remediation: Clean checklist, no highlight boxes */}
                      {msg.triage.fix_steps && msg.triage.fix_steps.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-800/60">
                          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                            <span>Recommended Resolution Steps:</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {(completedSteps[msg.id] || []).length}/{msg.triage.fix_steps.length} Steps Completed
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.triage.fix_steps.map((step, idx) => {
                              const isDone = (completedSteps[msg.id] || []).includes(idx);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleStepToggle(msg.id, idx)}
                                  className="flex items-start gap-2.5 py-1 cursor-pointer select-none group"
                                >
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border text-[10px] font-mono transition-colors ${
                                      isDone
                                        ? 'bg-slate-700 border-slate-600 text-white font-bold'
                                        : 'border-slate-700 text-slate-400 group-hover:border-slate-500'
                                    }`}
                                  >
                                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                                  </div>
                                  <span className={`text-xs leading-relaxed font-sans ${isDone ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* PII Redaction Notice: Clean muted text line, no colored background highlight */}
                      {msg.piiDetected && msg.piiDetected.length > 0 && (
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Auto-redacted {msg.piiDetected.join(', ')} before AI evaluation.</span>
                        </div>
                      )}

                      {/* Interactive Action Bar: Self-Resolved vs Ticket Creation */}
                      {msg.isResolved ? (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Issue Resolved</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                          <button
                            onClick={() => handleResolveIssue(msg.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>This Fixed My Issue</span>
                          </button>

                          {msg.ticketCreatedId ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E293B] border border-slate-700 text-[#80A6D7] text-xs font-mono">
                              <Ticket className="w-4 h-4" />
                              <span>Ticket Created: {msg.ticketCreatedId}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCreateTicketFromChat(msg)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                            >
                              <Ticket className="w-4 h-4 text-[#80A6D7]" />
                              <span>Still Need Help? Create Support Ticket</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {/* Conversational Assistant Response (Follow-up Chat Mode) */}
                  {msg.sender === 'assistant' && !msg.triage && !msg.isStreaming && (
                    <div className="space-y-3">
                      <MarkdownMessage content={msg.text} />

                      {/* PII Redaction Notice: Clean muted text line */}
                      {msg.piiDetected && msg.piiDetected.length > 0 && (
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Auto-redacted {msg.piiDetected.join(', ')} before AI evaluation.</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <img
                    src={currentUser.avatar || '/default.png'}
                    alt={currentUser.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0 mt-1"
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Persistent Bottom Chat Input Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0F1319] via-[#0F1319]/95 to-transparent backdrop-blur-md z-30">
            <div className="max-w-4xl mx-auto w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center bg-[#101828] border border-slate-700/80 hover:border-slate-500 focus-within:border-[#80A6D7] focus-within:ring-2 focus-within:ring-[#80A6D7]/20 rounded-2xl p-2 shadow-2xl transition-all"
              >
                <div className="pl-3 pr-2 text-[#80A6D7]">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a follow-up, report a step result, or describe another problem..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#F8F7F8] placeholder-slate-500 focus:outline-none px-2 py-1 font-sans"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSubmitting}
                  className="w-9 h-9 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F1319] flex items-center justify-center font-bold shadow-md transition-all active:scale-95 cursor-pointer ml-2"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
        </>
      )}

    </div>
  );
};

export default EmployeePortal;
