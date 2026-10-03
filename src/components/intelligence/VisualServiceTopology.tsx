import React, { useState } from 'react';
import { TopologyNode } from '../../types';
import { 
  Network, 
  Server, 
  Database, 
  Layers, 
  HardDrive, 
  Workflow 
} from 'lucide-react';

interface VisualServiceTopologyProps {
  nodes: TopologyNode[];
}

export const VisualServiceTopology: React.FC<VisualServiceTopologyProps> = ({ nodes }) => {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(nodes[1] || nodes[0]); // default selected: Payment Gateway

  const getNodeIcon = (type: TopologyNode['type']) => {
    switch (type) {
      case 'gateway':
        return Network;
      case 'database':
        return Database;
      case 'cache':
        return HardDrive;
      case 'broker':
        return Layers;
      default:
        return Server;
    }
  };

  const getStatusTheme = (status: TopologyNode['status']) => {
    switch (status) {
      case 'critical':
        return {
          border: 'border-red-500/80 shadow-glow-red',
          bg: 'bg-red-950/20',
          badge: 'text-red-400 font-mono text-xs font-semibold',
          text: 'text-red-400',
          dot: 'bg-red-500',
          label: 'Critical Failure',
        };
      case 'degraded':
        return {
          border: 'border-amber-500/60',
          bg: 'bg-amber-950/20',
          badge: 'text-amber-400 font-mono text-xs font-semibold',
          text: 'text-amber-400',
          dot: 'bg-amber-500',
          label: 'Degraded',
        };
      default:
        return {
          border: 'border-emerald-500/50',
          bg: 'bg-emerald-950/15',
          badge: 'text-emerald-400 font-mono text-xs font-semibold',
          text: 'text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'Operational',
        };
    }
  };

  return (
    <div className="rounded-2xl bg-[#1E293B] border border-slate-700/80 shadow-2xl flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Visual Service Topology</span>
              <span className="text-xs font-mono text-slate-400">
                • INTERACTIVE GRAPH
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Live causal node cascade — Click any node to inspect telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 pulse-indicator-critical" />
            <span className="text-slate-300 text-[11px]">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-300 text-[11px]">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 text-[11px]">Healthy</span>
          </div>
        </div>
      </div>

      {/* Topology Canvas Area */}
      <div className="relative p-6 bg-[#0B0F17]/90 min-h-[360px] flex-1 flex flex-col justify-center items-center overflow-x-auto">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-noc-grid opacity-50 pointer-events-none" />

        {/* Dynamic Topology Layout Container */}
        <div className="relative z-10 w-full max-w-4xl py-4">
          
          {/* Top Row: Primary Critical Path */}
          <div className="flex items-center justify-between gap-4 sm:gap-8 relative">
            
            {/* Horizontal Connecting Flow Line behind nodes */}
            <div className="absolute top-1/2 left-16 right-16 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-500/60 via-red-500 to-red-500/60 z-0 pointer-events-none" />

            {/* Node 1: Checkout API */}
            {nodes.find((n) => n.id === 'node-checkout') && (
              <TopologyNodeCard
                node={nodes.find((n) => n.id === 'node-checkout')!}
                isSelected={selectedNode?.id === 'node-checkout'}
                onSelect={() => setSelectedNode(nodes.find((n) => n.id === 'node-checkout')!)}
                theme={getStatusTheme(nodes.find((n) => n.id === 'node-checkout')!.status)}
                Icon={getNodeIcon('gateway')}
              />
            )}

            {/* Arrow Indicator 1 */}
            <div className="relative z-10 p-1.5 rounded-full bg-slate-900 border border-red-500/60 text-red-400 font-mono text-[10px] animate-pulse">
              ➔
            </div>

            {/* Node 2: Payment Gateway (Blast Center) */}
            {nodes.find((n) => n.id === 'node-gateway') && (
              <TopologyNodeCard
                node={nodes.find((n) => n.id === 'node-gateway')!}
                isSelected={selectedNode?.id === 'node-gateway'}
                onSelect={() => setSelectedNode(nodes.find((n) => n.id === 'node-gateway')!)}
                theme={getStatusTheme(nodes.find((n) => n.id === 'node-gateway')!.status)}
                Icon={getNodeIcon('service')}
                isBlastCenter
              />
            )}

            {/* Arrow Indicator 2 */}
            <div className="relative z-10 p-1.5 rounded-full bg-slate-900 border border-red-500/60 text-red-400 font-mono text-[10px] animate-pulse">
              ➔
            </div>

            {/* Node 3: Primary DB */}
            {nodes.find((n) => n.id === 'node-db') && (
              <TopologyNodeCard
                node={nodes.find((n) => n.id === 'node-db')!}
                isSelected={selectedNode?.id === 'node-db'}
                onSelect={() => setSelectedNode(nodes.find((n) => n.id === 'node-db')!)}
                theme={getStatusTheme(nodes.find((n) => n.id === 'node-db')!.status)}
                Icon={getNodeIcon('database')}
              />
            )}

          </div>

          {/* Bottom Row: Secondary Dependencies (Redis & Kafka) */}
          <div className="flex items-center justify-around gap-8 mt-10 pt-4 border-t border-dashed border-slate-800 relative">
            
            {/* Node 4: Redis Cache */}
            {nodes.find((n) => n.id === 'node-redis') && (
              <TopologyNodeCard
                node={nodes.find((n) => n.id === 'node-redis')!}
                isSelected={selectedNode?.id === 'node-redis'}
                onSelect={() => setSelectedNode(nodes.find((n) => n.id === 'node-redis')!)}
                theme={getStatusTheme(nodes.find((n) => n.id === 'node-redis')!.status)}
                Icon={getNodeIcon('cache')}
              />
            )}

            {/* Node 5: Kafka Event Bus */}
            {nodes.find((n) => n.id === 'node-kafka') && (
              <TopologyNodeCard
                node={nodes.find((n) => n.id === 'node-kafka')!}
                isSelected={selectedNode?.id === 'node-kafka'}
                onSelect={() => setSelectedNode(nodes.find((n) => n.id === 'node-kafka')!)}
                theme={getStatusTheme(nodes.find((n) => n.id === 'node-kafka')!.status)}
                Icon={getNodeIcon('broker')}
              />
            )}

          </div>

        </div>

      </div>

      {/* Interactive Node Telemetry Inspector Drawer */}
      {selectedNode && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${getStatusTheme(selectedNode.status).bg} ${getStatusTheme(selectedNode.status).border}`}>
              {React.createElement(getNodeIcon(selectedNode.type), {
                className: `w-5 h-5 ${getStatusTheme(selectedNode.status).text}`,
              })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{selectedNode.name}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getStatusTheme(selectedNode.status).badge}`}>
                  {selectedNode.status.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-slate-500">[{selectedNode.serviceKey}]</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{selectedNode.details}</p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">P99 LATENCY</span>
              <span className={`font-bold ${selectedNode.status === 'critical' ? 'text-red-400' : 'text-slate-200'}`}>
                {selectedNode.latency}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">ERROR RATE</span>
              <span className={`font-bold ${selectedNode.status === 'critical' ? 'text-red-400' : 'text-slate-200'}`}>
                {selectedNode.errorRate}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">CPU / MEM</span>
              <span className="font-bold text-slate-200">
                {selectedNode.cpuUsage} / {selectedNode.memoryUsage}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">POOL / CONNS</span>
              <span className="font-bold text-cyan-400">
                {selectedNode.connections}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

interface TopologyNodeCardProps {
  node: TopologyNode;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
  Icon: any;
  isBlastCenter?: boolean;
}

const TopologyNodeCard: React.FC<TopologyNodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  theme,
  Icon,
  isBlastCenter,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`relative z-10 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 w-52 sm:w-60 ${
        isSelected
          ? `${theme.bg} ${theme.border} ring-2 ring-cyan-500/50 scale-105`
          : 'bg-[#1E293B] border border-slate-700/80 hover:border-slate-500'
      }`}
    >
      {isBlastCenter && node.status === 'critical' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider shadow-glow-red animate-pulse">
          EPICENTER
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${theme.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-tight">{node.name}</h4>
            <span className="text-[10px] font-mono text-slate-400 block truncate">{node.serviceKey}</span>
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full mt-1 ${theme.dot}`} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div>
          <span className="text-slate-500 text-[10px]">Latency:</span>
          <div className={`font-semibold ${node.status === 'critical' ? 'text-red-400' : 'text-slate-300'}`}>
            {node.latency}
          </div>
        </div>
        <div>
          <span className="text-slate-500 text-[10px]">Error Rate:</span>
          <div className={`font-semibold ${node.status === 'critical' ? 'text-red-400' : 'text-emerald-400'}`}>
            {node.errorRate}
          </div>
        </div>
      </div>
    </div>
  );
};
