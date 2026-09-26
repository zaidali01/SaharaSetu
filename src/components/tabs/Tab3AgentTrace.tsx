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
    const color = 'var(--accent)';
    switch (type) {
      case 'voice_telephony': return <PhoneCall size={18} color={color} />;
      case 'state_engine':    return <Database size={18} color={color} />;
      case 'execution_layer': return <Send size={18} color={color} />;
      default:                return <Cpu size={18} color={color} />;
    }
  };

  const logBg = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'var(--red-50)', border: 'var(--red-100)', label: 'var(--red-600)' };
      case 'warning':  return { bg: 'var(--amber-50)', border: 'var(--amber-100)', label: 'var(--amber-600)' };
      case 'success':  return { bg: 'var(--green-50)', border: 'var(--green-100)', label: 'var(--green-600)' };
      default:         return { bg: '#fff', border: 'var(--card-border)', label: 'var(--text-secondary)' };
    }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <p className="page-breadcrumb">Operations / Agent Trace</p>
          <h1 className="page-title">Multi-Agent Pipeline Trace</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Real-time telemetry for <strong>{activeParent.name}</strong> ({activeParent.city}) · Sarvam ASR → State Engine → WhatsApp/UPI
          </p>
        </div>
        <div className="page-actions">
          <span className="status-pill active">
            <Zap size={13} />
            Pipeline Active
          </span>
          <span className="status-pill" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            End-to-End: 612ms
          </span>
        </div>
      </div>

      {/* ── Agent nodes ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--card-border)', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Zap size={14} color="var(--accent)" /> Autonomous Agent Nodes · {activeParent.name.split(' ')[0]}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, position: 'relative' }}>
          {agentNodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div key={node.id} style={{ position: 'relative' }}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    padding: 18,
                    borderRadius: 'var(--radius-lg)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                    background: isSelected ? 'var(--green-50)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-50)', border: '1px solid var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Node 0{index + 1}</span>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{node.name}</h4>
                      </div>
                    </div>
                    <span className="badge-inline verified" style={{ fontSize: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-600)' }} />
                      Active
                    </span>
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{node.shortName}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{node.activeDescription}</p>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Latency: <strong style={{ color: 'var(--accent)' }}>{node.latencyMs}ms</strong></span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Inspect →</span>
                  </div>
                </motion.div>

                {index < agentNodes.length - 1 && (
                  <div style={{ display: 'flex', position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '1px solid var(--card-border)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', pointerEvents: 'none' }}>
                    <ArrowRight size={14} color="var(--accent)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Node inspector */}
        <div className="card" style={{ marginTop: 20, padding: 16, background: 'var(--content-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--card-border)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={14} color="var(--accent)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Node: {selectedNode?.name}
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedNode?.model}</span>
            </div>
            <button onClick={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)} className="btn-ghost">
              {isJsonDrawerOpen ? 'Collapse' : 'Expand'}
              {isJsonDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {isJsonDrawerOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--card-border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                <strong style={{ color: 'var(--accent)' }}>System Constraint: </strong>
                {selectedNode?.systemPromptSummary}
              </div>
              <div style={{ padding: 12, background: '#1a1a2e', borderRadius: 8, overflowX: 'auto' }}>
                <pre className="mono" style={{ fontSize: 11, color: 'var(--sprout)', lineHeight: 1.6 }}>
                  {JSON.stringify(selectedNode?.lastPayload, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Event log ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--card-border)', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-600)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Execution Log
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>({filteredLogs.length} Events)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--content-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 2, gap: 2 }}>
              {['all', 'info', 'success', 'warning', 'critical'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedSeverity === sev ? '#fff' : 'transparent',
                    color: selectedSeverity === sev ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: selectedSeverity === sev ? 700 : 400,
                    textTransform: 'capitalize',
                    transition: 'all 0.1s',
                    boxShadow: selectedSeverity === sev ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button onClick={() => setIsLogStreaming(!isLogStreaming)} className="btn-outline" style={{ padding: '5px 12px', fontSize: 11 }}>
              {isLogStreaming ? <Pause size={11} color="var(--amber-600)" /> : <Play size={11} color="var(--green-600)" />}
              {isLogStreaming ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredLogs.map(log => {
            const isCopied = copiedLogId === log.id;
            const colors = logBg(log.severity);
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
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.timestamp}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff', border: '1px solid var(--card-border)', color: 'var(--accent)', fontWeight: 700 }}>
                      {log.agentSource}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{log.eventType}</span>
                  </div>
                  <p style={{ fontSize: 12, color: colors.label, lineHeight: 1.5 }}>{log.details}</p>
                </div>

                <button
                  onClick={() => handleCopyJson(log)}
                  title="Copy event payload JSON"
                  className="btn-ghost"
                  style={{ padding: 6, flexShrink: 0 }}
                >
                  {isCopied ? <Check size={13} color="var(--green-600)" /> : <Copy size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
