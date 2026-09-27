import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, PhoneCall, Database, Send, Terminal, Copy, Check,
  Pause, Play, ArrowRight, Zap, ChevronDown, ChevronUp
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

  const selectedNode = agentNodes.find(n => n.id === selectedNodeId) || agentNodes[0];
  const filteredLogs = eventLogs.filter(log => selectedSeverity === 'all' || log.severity === selectedSeverity);

  const handleCopyJson = (log: EventLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const getNodeIcon = (type: string) => {
    const color = 'var(--terracotta)';
    switch (type) {
      case 'voice_telephony': return <PhoneCall size={18} color={color} />;
      case 'state_engine':    return <Database size={18} color={color} />;
      case 'execution_layer': return <Send size={18} color={color} />;
      default:                return <Cpu size={18} color={color} />;
    }
  };

  const logBg = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'var(--soft-accent-tint)', border: 'var(--terracotta)', label: 'var(--terracotta)' };
      case 'warning':  return { bg: 'var(--review-soft)', border: 'var(--mustard)', label: 'var(--review-text)' };
      case 'success':  return { bg: 'var(--success-soft)', border: 'var(--success)', label: 'var(--success)' };
      default:         return { bg: '#fff', border: 'var(--border-light)', label: 'var(--text-ink)' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header-container">
        <div>
          <p className="page-breadcrumb">Operations / Agent Trace</p>
          <h1 className="page-title">Multi-Agent Pipeline Trace</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Real-time telemetry for <strong>{activeParent.name}</strong> ({activeParent.city}) · Sarvam ASR → State Engine → WhatsApp/UPI
          </p>
        </div>
        <div className="page-actions">
          <span className="status-chip active">
            <Zap size={13} />
            Pipeline Active
          </span>
          <span className="status-chip mono" style={{ fontSize: 11 }}>
            End-to-End: 612ms
          </span>
        </div>
      </div>

      {/* ── Agent nodes ── */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 20 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="var(--terracotta)" /> Autonomous Agent Nodes · {activeParent.name.split(' ')[0]}
          </span>
        </div>

        <div className="agent-nodes-grid">
          {agentNodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div key={node.id} style={{ position: 'relative' }}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--terracotta)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--soft-accent-tint)' : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: isSelected ? 'none' : '0 1px 3px rgba(36,51,43,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div>
                        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Node 0{index + 1}</span>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-ink)' }}>{node.name}</h4>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} /> Active
                    </span>
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ink)', marginBottom: 4 }}>{node.shortName}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{node.activeDescription}</p>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Latency: <strong className="mono" style={{ color: 'var(--terracotta)' }}>{node.latencyMs}ms</strong></span>
                    <span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Inspect →</span>
                  </div>
                </motion.div>

                {index < agentNodes.length - 1 && (
                  <div className="agent-node-connector" style={{ display: 'flex', position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '1px solid var(--border-light)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(36,51,43,0.08)', pointerEvents: 'none' }}>
                    <ArrowRight size={14} color="var(--terracotta)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Node inspector */}
        <div className="card" style={{ marginTop: 24, padding: 20, background: 'var(--surface-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Terminal size={16} color="var(--terracotta)" />
              <span className="mono" style={{ fontWeight: 700, color: 'var(--text-ink)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Node: {selectedNode?.name}
              </span>
              <span className="mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--card-bg)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>{selectedNode?.model}</span>
            </div>
            <button onClick={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)} className="btn btn-ghost">
              {isJsonDrawerOpen ? 'Collapse' : 'Expand'}
              {isJsonDrawerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {isJsonDrawerOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: 16, background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: 14, color: 'var(--text-ink)', lineHeight: 1.6, marginBottom: 16 }}>
                <strong style={{ color: 'var(--terracotta)' }}>System Constraint: </strong>
                {selectedNode?.systemPromptSummary}
              </div>
              <div style={{ padding: 16, background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                <pre className="mono" style={{ fontSize: 12, color: 'var(--text-on-dark)', lineHeight: 1.6 }}>
                  {JSON.stringify(selectedNode?.lastPayload, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Event log ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Execution Log
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>({filteredLogs.length} Events)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', padding: 4, gap: 4 }}>
              {['all', 'info', 'success', 'warning', 'critical'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', border: 'none',
                    background: selectedSeverity === sev ? '#fff' : 'transparent',
                    color: selectedSeverity === sev ? 'var(--text-ink)' : 'var(--text-muted)',
                    fontWeight: selectedSeverity === sev ? 600 : 500,
                    textTransform: 'capitalize', transition: 'all 0.15s',
                    boxShadow: selectedSeverity === sev ? '0 1px 3px rgba(36,51,43,0.06)' : 'none',
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button onClick={() => setIsLogStreaming(!isLogStreaming)} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 12 }}>
              {isLogStreaming ? <Pause size={14} /> : <Play size={14} />}
              {isLogStreaming ? 'Pause Stream' : 'Resume Stream'}
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredLogs.map(log => {
            const isCopied = copiedLogId === log.id;
            const colors = logBg(log.severity);
            return (
              <div
                key={log.id}
                style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${colors.border}`, background: colors.bg,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.timestamp}</span>
                    <span className="mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: '#fff', border: `1px solid ${colors.border}`, color: colors.label, fontWeight: 700 }}>
                      {log.agentSource}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-ink)', fontWeight: 700 }}>{log.eventType}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-ink)', lineHeight: 1.5 }}>{log.details}</p>
                </div>

                <button
                  onClick={() => handleCopyJson(log)}
                  title="Copy event payload JSON"
                  className="btn btn-ghost"
                  style={{ padding: 8, flexShrink: 0 }}
                >
                  {isCopied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
