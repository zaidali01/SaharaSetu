import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  PhoneCall, 
  Database, 
  Send, 
  Terminal, 
  Copy, 
  Check, 
  Pause, 
  Play, 
  ArrowRight, 
  Zap, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EventLogItem } from '../../data/mockData';

export const Tab3AgentTrace: React.FC = () => {
  const { agentNodes, eventLogs } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('agent-caller');
  const [isLogStreaming, setIsLogStreaming] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState<boolean>(true);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const selectedNode = agentNodes.find((n) => n.id === selectedNodeId) || agentNodes[0];

  const filteredLogs = eventLogs.filter((log) => {
    if (selectedSeverity === 'all') return true;
    return log.severity === selectedSeverity;
  });

  const handleCopyJson = (log: EventLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'voice_telephony':
        return <PhoneCall className="w-5 h-5 text-teal-400" />;
      case 'state_engine':
        return <Database className="w-5 h-5 text-indigo-400" />;
      case 'execution_layer':
        return <Send className="w-5 h-5 text-emerald-400" />;
      default:
        return <Cpu className="w-5 h-5 text-teal-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Multi-Agent Telephony & Action Pipeline Trace
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Task 4.6 Multi-Agent Trace
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time execution telemetry connecting Sarvam Indic ASR, Postgres Guardrail State Machine, and WhatsApp/UPI Execution.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sarvam AI: Transcribing Bhojpuri audio stream...</span>
        </div>
      </div>

      {/* Dark Observability Console Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-white">
        
        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            Autonomous Agent Nodes & State Flow
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            End-to-End Latency: 612 ms
          </span>
        </div>

        {/* 3 Connected Agents Grid with Flow Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {agentNodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;

            return (
              <div key={node.id} className="relative flex flex-col">
                {/* Node Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-teal-400 bg-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.2)] ring-2 ring-teal-500/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Active Status Ring & Pulse */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {getNodeIcon(node.type)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">
                          Node 0{index + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {node.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Active</span>
                    </div>
                  </div>

                  {/* Subtitle & Provider */}
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-300 font-semibold">{node.shortName}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {node.activeDescription}
                    </p>
                  </div>

                  {/* Node Telemetry Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Latency: <strong className="text-teal-300">{node.latencyMs}ms</strong></span>
                    <span className="text-indigo-300">Inspect ➔</span>
                  </div>
                </motion.div>

                {/* Flow Connector Arrow for Desktop */}
                {index < agentNodes.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-teal-400">
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Selected Node Deep-Dive Inspector */}
        <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-slate-200">
                Inspecting Node: <span className="text-teal-400">{selectedNode.name}</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Model: {selectedNode.model}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                System Guardrail & Prompt Architecture
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedNode.systemPromptSummary}
              </p>
            </div>

            <div className="space-y-1.5 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Latest Inferred Telemetry State
              </span>
              <pre className="font-mono text-[10px] text-teal-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800 max-h-24">
                {JSON.stringify(selectedNode.lastPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Live System Event Log (JSON Stream) */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          {/* Drawer Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white tracking-tight uppercase">
                Live System Event Log (JSON Stream)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                {filteredLogs.length} Events Logged
              </span>
            </div>

            {/* Controls: Filter + Pause/Stream + Collapse */}
            <div className="flex items-center gap-2">
              {/* Filter pills */}
              <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg text-[10px]">
                {['all', 'info', 'success', 'warning', 'critical'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2 py-1 rounded capitalize font-medium cursor-pointer transition-colors ${
                      selectedSeverity === sev ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsLogStreaming(!isLogStreaming)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isLogStreaming ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isLogStreaming ? 'Streaming' : 'Paused'}</span>
              </button>

              <button
                onClick={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                {isJsonDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Logs Feed */}
          {isJsonDrawerOpen && (
            <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-2.5">
              {filteredLogs.map((log) => {
                const isCrit = log.severity === 'critical';
                const isWarn = log.severity === 'warning';
                const isSucc = log.severity === 'success';

                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCrit
                        ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                        : isSucc
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isCrit
                              ? 'bg-rose-800 text-white'
                              : isWarn
                              ? 'bg-amber-800 text-white'
                              : isSucc
                              ? 'bg-emerald-800 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.severity}
                        </span>
                        <span className="font-bold text-slate-200 text-xs">{log.eventType}</span>
                        <span className="text-[11px] text-teal-400 font-sans">({log.agentSource})</span>
                      </div>

                      <button
                        onClick={() => handleCopyJson(log)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Copy JSON payload"
                      >
                        {copiedLogId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-300 font-sans leading-relaxed">
                      {log.details}
                    </p>

                    <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-900 text-[10px] text-slate-400 overflow-x-auto">
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
