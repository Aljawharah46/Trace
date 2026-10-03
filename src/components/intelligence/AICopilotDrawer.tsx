import React, { useState } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { Incident, CopilotMessage } from '../../types';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Bot, 
  User as UserIcon, 
  FileText, 
  Clock, 
  Terminal
} from 'lucide-react';

interface AICopilotDrawerProps {
  incident: Incident;
  isOpen: boolean;
  onToggle: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  incident,
  isOpen,
  onToggle,
}) => {
  const { currentUser } = useIncident();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hello ${currentUser.name}. I have correlated telemetry for incident ${incident.id} ("${incident.title}"). 
Confidence is 98% that the blast radius originated from database connection pool saturation. How can I assist with this triage?`,
      timestamp: '10:06 UTC',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleQuickPrompt = (promptType: 'FIRST_FAILURE' | 'WHO_RESOLVED' | 'DRAFT_REPORT') => {
    if (promptType === 'FIRST_FAILURE') {
      const userMsg: CopilotMessage = {
        id: `msg-${Date.now()}-u`,
        sender: 'user',
        text: 'What failed first?',
        timestamp: 'Just now',
      };

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'ai',
        text: `### Chronological Failure Sequence Analysis:

1. **10:02:14 UTC (First Root Signal):** Primary PostgreSQL DB (\`pg-writer-aurora\`) hit connection pool saturation (92/100 active connections) caused by an unindexed query (\`PID #4819\`) on \`txn_ledger\` executed by an analytical worker.
2. **10:03:08 UTC (Cascading Propagation):** \`checkout-gateway-prod\` thread workers queued waiting for DB connection release, causing p99 latency to spike from 140ms to **4,820ms**.
3. **10:04:22 UTC (Threshold Breach):** Gateway began emitting HTTP 504 Timeouts (34.2% rate).
4. **10:05:41 UTC (Secondary Victim):** Redis token cache experienced timeout cascade due to queued socket backlog.
5. **10:06:19 UTC (P1 Outage):** Customer checkout payment failure rate spiked to **82.4%**, triggering automated P1 declaration.

**Conclusion:** The Primary Database connection exhaustion was the root trigger; the payment gateway failure is a downstream victim.`,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
    } else if (promptType === 'WHO_RESOLVED') {
      const userMsg: CopilotMessage = {
        id: `msg-${Date.now()}-u`,
        sender: 'user',
        text: 'Who resolved this last time?',
        timestamp: 'Just now',
      };

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'ai',
        text: `### Operational Memory Match (89% Similarity):

- **Historical Incident:** \`#TRC-0421\` (*Payment Gateway Connection Timeout & Starvation*)
- **Resolved By:** **Sarah Connor** (Staff SRE, Digital Commerce)
- **Resolved When:** 45 days ago
- **Time to Resolve (MTTR):** 18 minutes
- **Past Resolution Runbook:**
  1. Terminated PID query on RDS writer master via \`pg_terminate_backend()\`.
  2. Dynamically raised RDS parameter group \`max_connections\` from 100 to 300.
  3. Applied composite index \`CREATE INDEX idx_txn_ledger_status ON txn_ledger(status, created_at)\`.
- **Outcome:** Normal transaction flow was restored in under 4 minutes with SAR 780,000 saved.`,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
    } else if (promptType === 'DRAFT_REPORT') {
      const userMsg: CopilotMessage = {
        id: `msg-${Date.now()}-u`,
        sender: 'user',
        text: 'Draft executive incident report',
        timestamp: 'Just now',
      };

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'ai',
        isReport: true,
        text: `# EXECUTIVE INCIDENT POST-MORTEM & WAR ROOM SUMMARY
**Incident ID:** ${incident.id}  
**Classification:** P1 - CRITICAL OUTAGE  
**Affected System:** ${incident.affectedService} (Payment Gateway & Ingress)  
**Declared At:** 10:06 UTC | **Investigator:** ${currentUser.name}  

---

### 1. Executive Summary
At 10:06 UTC, an automated P1 incident was declared following an abrupt drop in customer payment authorization rates (82.4% failure). The failure prevented retail customers from completing checkout, risking approximately **SAR 850,000** in digital transactions across 14,200 checkout attempts.

### 2. Root Cause Analysis (RCA)
- **Primary Mechanism:** Connection pool exhaustion on the primary Aurora PostgreSQL database cluster.
- **Trigger:** A legacy analytics reconciliation process executed a long-running, unindexed table scan (\`PID #4819\`: \`SELECT * FROM txn_ledger WHERE status = 'PENDING' FOR UPDATE\`), acquiring exclusive row-level locks and holding active connection pool slots.
- **Cascading Failure:** Payment API worker threads were starved of database handles, leading to HTTP 504 timeouts and Redis idempotency token expiry.

### 3. Immediate Mitigation Executed
- Terminated blocking session PID #4819.
- Dynamically scaled PostgreSQL connection pool ceiling from 100 to 300.
- Purged stale redis cache keys.

### 4. Preventive Corrective Actions (CAPA)
1. Add index on \`txn_ledger(status, created_at)\` in DB migration pipeline.
2. Direct all analytical reporting queries to Aurora read-replica endpoints.
3. Configure connection pool headroom threshold alarm at 75% capacity.`,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulated contextual AI response
    setTimeout(() => {
      const aiReply: CopilotMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'ai',
        text: `Regarding "${userText}": Based on TRACE's telemetry cross-correlation with Aurora DB metrics and Envoy ingress access logs, applying the recommended fix (expanding connection pool to 300 and terminating PID #4819) will restore latency to <100ms within 30 seconds without requiring a cluster reboot.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 600);
  };

  return (
    <>
      {/* Drawer Toggle Tab (visible when drawer closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-l from-cyan-600 to-slate-900 border-l border-y border-cyan-500/50 p-3 rounded-l-2xl shadow-glow-cyan text-cyan-300 hover:text-white flex items-center gap-2 font-mono text-xs font-bold transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 animate-pulse" />
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">AI COPILOT</span>
        </button>
      )}

      {/* Drawer Sidebar */}
      <div
        className={`fixed top-16 right-0 bottom-0 z-40 w-full sm:w-[480px] bg-[#111927]/98 border-l border-slate-700/80 shadow-2xl backdrop-blur-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">TRACE AI Copilot</h3>
                <span className="text-xs font-mono text-slate-400">
                  • REASONING ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Contextual incident correlation for {incident.id}
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            Suggested Quick Actions:
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickPrompt('FIRST_FAILURE')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-[11px] font-mono transition-all"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>What failed first?</span>
            </button>

            <button
              onClick={() => handleQuickPrompt('WHO_RESOLVED')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 hover:border-purple-500/40 text-[11px] font-mono transition-all"
            >
              <Terminal className="w-3 h-3 text-purple-400" />
              <span>Who resolved this last time?</span>
            </button>

            <button
              onClick={() => handleQuickPrompt('DRAFT_REPORT')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-mono transition-all"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Draft executive incident report</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => {
            const isAI = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isAI
                      ? 'bg-gradient-to-br from-cyan-600 to-teal-700 text-white shadow-glow-cyan'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`relative max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isAI
                      ? 'bg-slate-900/90 border border-slate-700/80 text-slate-200'
                      : 'bg-cyan-600 text-white font-medium'
                  }`}
                >
                  {isAI && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                      <span>TRACE AI SYNTHESIS</span>
                      <button
                        onClick={() => handleCopy(msg.text, index)}
                        className="hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                        title="Copy Response"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text}
                  </div>

                  <div className="mt-1 text-[9px] font-mono opacity-60 text-right">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800 bg-slate-900/80">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask TRACE Copilot about logs, queries, runbooks..."
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] font-mono text-slate-500">
            Press Enter to query TRACE correlation engine
          </div>
        </form>

      </div>
    </>
  );
};
