import React, { useState } from 'react';
import { TelemetryEvent } from '../../types';
import { 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Search, 
  Play,
  Pause
} from 'lucide-react';

interface TelemetryTimelineProps {
  events: TelemetryEvent[];
}

export const TelemetryTimeline: React.FC<TelemetryTimelineProps> = ({ events }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'ERROR' | 'WARNING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  const filteredEvents = events.filter((evt) => {
    if (filterLevel === 'CRITICAL' && evt.level !== 'critical') return false;
    if (filterLevel === 'ERROR' && evt.level !== 'error' && evt.level !== 'critical') return false;
    if (filterLevel === 'WARNING' && evt.level === 'info') return false;
    if (
      searchTerm &&
      !evt.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !evt.service.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !evt.metric.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getLevelBadge = (level: TelemetryEvent['level']) => {
    switch (level) {
      case 'critical':
        return {
          icon: AlertOctagon,
          class: 'text-red-400',
          dot: 'bg-red-500',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          class: 'text-orange-400',
          dot: 'bg-orange-500',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          class: 'text-amber-400',
          dot: 'bg-amber-500',
        };
      default:
        return {
          icon: Info,
          class: 'text-cyan-400',
          dot: 'bg-cyan-500',
        };
    }
  };

  return (
    <div className="rounded-2xl bg-[#1E293B] border border-slate-700/80 shadow-2xl flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Telemetry & Live Event Timeline</span>
              <span className="text-[11px] font-mono text-slate-400">
                • CORRELATED LOG STREAM
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Synchronized cross-service metric anomalies & event sequence
            </p>
          </div>
        </div>

        {/* Live indicator & Pause toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
              isLiveStreaming
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isLiveStreaming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>STREAMING</span>
                <Pause className="w-3 h-3 ml-1" />
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-cyan-400" />
                <span>PAUSED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 font-mono">
          {(['ALL', 'CRITICAL', 'ERROR', 'WARNING'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider transition-colors ${
                filterLevel === lvl
                  ? 'bg-slate-700 text-cyan-300 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs & metrics..."
            className="w-full pl-8 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[460px]">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No events match the selected filter.
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const levelConfig = getLevelBadge(evt.level);
            const Icon = levelConfig.icon;

            return (
              <div key={evt.id || idx} className="relative flex items-start gap-4 group">
                
                {/* Connecting vertical line */}
                {idx < filteredEvents.length - 1 && (
                  <div className="absolute left-[23px] top-7 bottom-[-16px] w-[2px] bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                )}

                {/* Timestamp Node */}
                <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-12 h-8 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-cyan-300 shadow-sm">
                  {evt.timeOffset}
                </div>

                {/* Event Card */}
                <div className={`flex-1 p-3.5 rounded-xl border transition-all ${
                  evt.level === 'critical'
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/70 shadow-sm'
                    : evt.level === 'error'
                    ? 'bg-orange-950/15 border-orange-500/40 hover:border-orange-500/70'
                    : evt.level === 'info'
                    ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold uppercase ${levelConfig.class}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{evt.badge || evt.level}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-semibold truncate max-w-[200px]">
                        {evt.service}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {evt.message}
                  </p>

                  {/* Telemetry Metric readout */}
                  {evt.metric && (
                    <div className="mt-2 font-mono text-[11px] text-slate-300">
                      {evt.metric}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 border-t border-slate-800 bg-slate-900/60 text-center font-mono text-[10px] text-slate-400">
        AI Correlation Window: 10:00 UTC - 10:08 UTC • 5,420 events reduced to 5 causal signals
      </div>

    </div>
  );
};
