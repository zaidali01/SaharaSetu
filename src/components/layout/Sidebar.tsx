import React from 'react';
import { Layers, FileText, Cpu, ShieldCheck, PhoneCall, Radio, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsGuardrailsOpen,
    setIsParentProfileOpen,
    documents,
    activeParent,
  } = useApp();

  const pendingDocs = documents.filter(d => d.status === 'pending_review' || d.status === 'processed').length;

  const navItems = [
    { id: 'command_board' as const, label: 'Command Board', icon: Layers },
    { id: 'document_intake' as const, label: 'Document Intake', icon: FileText, badge: pendingDocs > 0 ? pendingDocs : undefined },
    { id: 'agent_trace' as const, label: 'Agent Trace View', icon: Cpu },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">S</div>
        <span className="sidebar-brand-name">SaharaSetu</span>
      </div>

      {/* Primary nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-nav-item${activeTab === item.id ? ' active' : ''}`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
            {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Operational context section */}
      <div className="sidebar-section-label">Operational Context</div>
      <nav className="sidebar-nav">
        <button
          onClick={() => setIsGuardrailsOpen(true)}
          className="sidebar-nav-item"
        >
          <ShieldCheck size={16} />
          <span>Guardrail Policies</span>
        </button>
        <button className="sidebar-nav-item" style={{ cursor: 'default' }}>
          <PhoneCall size={16} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>Call Logs</span>
            <span style={{ fontSize: 11, color: 'var(--muted-on-dark-60)' }}>
              {activeParent.preferredLanguage || 'Hindi'} / {activeParent.secondaryLanguage || 'Bhojpuri'}
            </span>
          </span>
        </button>
      </nav>

      {/* Voice agent / User card at bottom */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className="voice-agent-bar">
          <div className="voice-agent-pill">
            <span className="dot" />
            <span>Bihar IndicSarathi 2.0</span>
            <Radio size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </div>
        </div>

        {/* User Card */}
        <button 
          onClick={() => setIsParentProfileOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
            background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(250, 247, 240, 0.1)',
            cursor: 'pointer', border: 'none', color: 'var(--text-on-dark)', textAlign: 'left', width: '100%'
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sidebar-active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="var(--muted-on-dark-60)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{activeParent.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-on-dark-60)' }}>{activeParent.city || 'Patna'}</div>
          </div>
        </button>
      </div>
    </aside>
  );
};
