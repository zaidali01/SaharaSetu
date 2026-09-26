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
  const { agentNodes, eventLogs, activeParent } = useApp();
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
            Real-time execution telemetry for <strong>{activeParent.name}</strong> ({activeParent.city}) connecting Sarvam Indic ASR, Postgres Guardrail State Machine, and WhatsApp/UPI Execution.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sarvam AI: Transcribing {activeParent.language.split('/')[0]} audio stream...</span>
        </div>
      </div>

      {/* Dark Observability Console Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-white">
        
        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            Autonomous Agent Nodes & State Flow ({activeParent.name.split(' ')[0]})
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
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-teal-400 shadow-md pointer-events-none">
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Telemetry Deep Dive Inspector */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4.5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white uppercase text-[11px]">
                Active Node Payload: {selectedNode.name}
              </span>
              <span className="text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded">
                Model: {selectedNode.model}
              </span>
            </div>

            <button
              onClick={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{isJsonDrawerOpen ? 'Collapse' : 'Expand'}</span>
              {isJsonDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isJsonDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
                <strong className="text-teal-400 font-mono">System Prompt Constraint: </strong>
                {selectedNode.systemPromptSummary}
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
                <pre className="text-[11px] text-emerald-400 leading-relaxed">
                  {JSON.stringify(selectedNode.lastPayload, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </div>

        {/* Real-time Streaming Event Log Terminal */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live State & Execution Event Log
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({filteredLogs.length} Events)</span>
            </div>

            {/* Filter Chips & Stream Pause Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg text-[10px] font-mono border border-slate-800">
                {['all', 'info', 'success', 'warning', 'critical'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                      selectedSeverity === sev
                        ? 'bg-teal-500/20 text-teal-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsLogStreaming(!isLogStreaming)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                {isLogStreaming ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isLogStreaming ? 'Pause' : 'Resume'}</span>
              </button>
            </div>
          </div>

          {/* Event Stream Terminal Window */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 font-mono text-xs">
            {filteredLogs.map((log) => {
              const isCopied = copiedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    log.severity === 'critical'
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                      : log.severity === 'warning'
                      ? 'bg-amber-950/30 border-amber-800/70 text-amber-200'
                      : log.severity === 'success'
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 text-[10px] font-bold">
                        {log.agentSource}
                      </span>
                      <span className="text-white font-bold">{log.eventType}</span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-200 leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyJson(log)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy event payload JSON"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
