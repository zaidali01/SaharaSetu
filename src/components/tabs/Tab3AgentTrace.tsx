import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, PhoneCall, Database, Send, Terminal, Copy, Check,
  Pause, Play, ArrowRight, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EventLogItem } from '../../data/mockData';

const consoleSurface: React.CSSProperties = {
  background: 'rgba(18,35,20,0.9)',
  border: '1px solid var(--color-moss-shadow)',
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
};

export const Tab3AgentTrace: React.FC = () => {
  const { agentNodes, eventLogs, activeParent } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('agent-caller');
  const [isLogStreaming, setIsLogStreaming] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState<boolean>(true);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const selectedNode = agentNodes.find(n => n.id === selectedNodeId) || agentNodes[0];
  const filteredLogs = eventLogs.filter(log => selectedSeverity === 'all' || log.severity === selectedSeverity);

  const handleCopyJson = (log: EventLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'voice_telephony': return <PhoneCall size={18} color="var(--color-electric-sprout)" />;
      case 'state_engine':   return <Database size={18} color="var(--color-electric-sprout)" />;
      case 'execution_layer':return <Send size={18} color="var(--color-electric-sprout)" />;
      default:               return <Cpu size={18} color="var(--color-electric-sprout)" />;
    }
  };

  const logColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#fca5a5' };
      case 'warning':  return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fcd34d' };
      case 'success':  return { bg: 'rgba(104,239,63,0.06)', border: 'rgba(104,239,63,0.15)', text: '#86efac' };
      default:         return { bg: 'rgba(39,63,43,0.5)', border: 'var(--color-moss-shadow)', text: 'var(--color-pale-fern)' };
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--color-pure-white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Agent <span style={{ color: 'var(--color-electric-sprout)' }}>Trace</span>
          </h1>
          <span className="badge badge-sage" style={{ fontSize: 11 }}>Task 4.6</span>
        </div>
        <p style={{ color: 'var(--color-lichen-sage)', fontSize: 14 }}>
          Real-time telemetry for <strong style={{ color: 'var(--color-pure-white)' }}>{activeParent.name}</strong> ({activeParent.city}) connecting Sarvam Indic ASR → Postgres State Engine → WhatsApp/UPI
        </p>
      </div>

      {/* ── Top banner ── */}
      <div style={{ ...consoleSurface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={16} color="var(--color-electric-sprout)" />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-pure-white)' }}>Multi-Agent Telephony & Action Pipeline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-electric-sprout)', display: 'inline-block' }} className="dot-live" />
          <span style={{ color: 'var(--color-electric-sprout)' }}>Sarvam AI: Transcribing {activeParent.language?.split('/')[0] || 'Hindi'} stream...</span>
          <span className="badge badge-dark" style={{ fontSize: 10 }}>End-to-End: 612ms</span>
        </div>
      </div>

      {/* ── Agent node grid ── */}
      <div style={{ ...consoleSurface, padding: 24, marginBottom: 20 }}>

        {/* Console header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--color-moss-shadow)', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-lichen-sage)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Zap size={14} color="var(--color-electric-sprout)" /> Autonomous Agent Nodes · {activeParent.name.split(' ')[0]}
          </span>
        </div>

        {/* Node cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, position: 'relative' }}>
          {agentNodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div key={node.id} style={{ position: 'relative' }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    border: isSelected ? '2px solid var(--color-electric-sprout)' : '1px solid var(--color-moss-shadow)',
                    background: isSelected ? 'rgba(104,239,63,0.06)' : 'rgba(39,63,43,0.3)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 20px rgba(104,239,63,0.12)' : 'none',
                    transition: 'border 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(104,239,63,0.08)', border: '1px solid rgba(104,239,63,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-electric-sprout)', display: 'block' }}>
                          Node 0{index + 1}
                        </span>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-pure-white)' }}>{node.name}</h4>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(104,239,63,0.08)', border: '1px solid rgba(104,239,63,0.2)', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-electric-sprout)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-electric-sprout)' }} />
                      Active
                    </div>
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-pale-fern)', marginBottom: 4 }}>{node.shortName}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-lichen-sage)', lineHeight: 1.5 }}>{node.activeDescription}</p>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-moss-shadow)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    <span style={{ color: 'var(--color-lichen-sage)' }}>Latency: <strong style={{ color: 'var(--color-electric-sprout)' }}>{node.latencyMs}ms</strong></span>
                    <span style={{ color: 'var(--color-electric-sprout)' }}>Inspect →</span>
                  </div>
                </motion.div>

                {/* Arrow connector */}
                {index < agentNodes.length - 1 && (
                  <div style={{ display: 'flex', position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'var(--color-moss-shadow)', border: '1px solid var(--color-electric-sprout)', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <ArrowRight size={14} color="var(--color-electric-sprout)" style={{ animation: 'pulse 2s infinite' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Node inspector */}
        <div style={{ marginTop: 20, ...consoleSurface, padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--color-moss-shadow)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={14} color="var(--color-electric-sprout)" />
              <span style={{ fontWeight: 700, color: 'var(--color-pure-white)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Node: {selectedNode?.name}
              </span>
              <span className="badge badge-dark" style={{ fontSize: 10 }}>{selectedNode?.model}</span>
            </div>
            <button onClick={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-lichen-sage)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              {isJsonDrawerOpen ? 'Collapse' : 'Expand'}
              {isJsonDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {isJsonDrawerOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: 12, background: 'rgba(39,63,43,0.4)', borderRadius: 10, border: '1px solid var(--color-moss-shadow)', fontSize: 12, color: 'var(--color-pale-fern)', lineHeight: 1.6, marginBottom: 12 }}>
                <strong style={{ color: 'var(--color-electric-sprout)', fontFamily: 'var(--font-mono)' }}>System Constraint: </strong>
                {selectedNode?.systemPromptSummary}
              </div>
              <div style={{ padding: 12, background: 'var(--color-forest-depths)', borderRadius: 10, border: '1px solid var(--color-moss-shadow)', overflowX: 'auto' }}>
                <pre style={{ fontSize: 11, color: 'var(--color-electric-sprout)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                  {JSON.stringify(selectedNode?.lastPayload, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Event log terminal ── */}
      <div style={{ ...consoleSurface, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--color-moss-shadow)', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-electric-sprout)' }} className="dot-live" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-pure-white)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Execution Log
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-lichen-sage)', fontFamily: 'var(--font-mono)' }}>({filteredLogs.length} Events)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--color-forest-depths)', border: '1px solid var(--color-moss-shadow)', borderRadius: 8, padding: '2px', gap: 2 }}>
              {['all', 'info', 'success', 'warning', 'critical'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedSeverity === sev ? 'rgba(104,239,63,0.15)' : 'transparent',
                    color: selectedSeverity === sev ? 'var(--color-electric-sprout)' : 'var(--color-lichen-sage)',
                    fontWeight: selectedSeverity === sev ? 700 : 400,
                    textTransform: 'capitalize',
                    transition: 'all 0.1s',
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsLogStreaming(!isLogStreaming)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'rgba(39,63,43,0.6)', border: '1px solid var(--color-moss-shadow)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-pale-fern)', cursor: 'pointer' }}
            >
              {isLogStreaming ? <Pause size={11} color="#f59e0b" /> : <Play size={11} color="var(--color-electric-sprout)" />}
              {isLogStreaming ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredLogs.map(log => {
            const isCopied = copiedLogId === log.id;
            const colors = logColor(log.severity);
            return (
              <div
                key={log.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--color-lichen-sage)' }}>{log.timestamp}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(39,63,43,0.8)', color: 'var(--color-electric-sprout)', fontWeight: 700 }}>
                      {log.agentSource}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-pure-white)', fontWeight: 700 }}>{log.eventType}</span>
                  </div>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: colors.text, lineHeight: 1.5 }}>{log.details}</p>
                </div>

                <button
                  onClick={() => handleCopyJson(log)}
                  title="Copy event payload JSON"
                  style={{ padding: 7, borderRadius: 8, background: 'rgba(39,63,43,0.8)', border: '1px solid var(--color-moss-shadow)', color: 'var(--color-lichen-sage)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.1s' }}
                >
                  {isCopied ? <Check size={13} color="var(--color-electric-sprout)" /> : <Copy size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
