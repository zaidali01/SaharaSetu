import React from 'react';
import { ShieldCheck, AlertTriangle, ChevronDown, Layers, FileText, Cpu, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeParent,
    setIsGuardrailsOpen,
    setIsAlertsDrawerOpen,
    setIsParentProfileOpen,
    criticalFlags,
    backendStatus,
    refreshFromBackend,
  } = useApp();

  const unresolvedFlags = criticalFlags.filter((f) => !f.resolved);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '12px 24px',
      }}
    >
      {/* ── Floating Pill Nav ── */}
      <div
        className="nav-pill page-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 20px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* LEFT: Brand + parent chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--color-electric-sprout)',
                color: 'var(--color-onyx-olive)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              सह
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--color-pure-white)',
                letterSpacing: '-0.02em',
              }}
            >
              SaharaSetu
            </span>
            {/* Live tag */}
            <span
              className="badge badge-dark"
              style={{ fontSize: 10, padding: '2px 8px' }}
            >
              ● Live
            </span>
          </div>

          {/* Parent selector */}
          <button
            onClick={() => setIsParentProfileOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 11px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-moss-shadow)',
              background: 'rgba(39,63,43,0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: 'var(--color-pale-fern)',
              fontSize: 13,
            }}
          >
            <span>👴</span>
            <span style={{ fontWeight: 500, color: 'var(--color-pure-white)' }}>
              {activeParent.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-lichen-sage)' }}>
              {activeParent.city || 'Patna'}
            </span>
            <ChevronDown size={13} color="var(--color-lichen-sage)" />
          </button>
        </div>

        {/* CENTER: Tab navigation */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <button
            id="nav-tab-command-board"
            onClick={() => setActiveTab('command_board')}
            className={`tab-btn${activeTab === 'command_board' ? ' active' : ''}`}
          >
            <Layers size={13} />
            <span>Command Board</span>
            <kbd style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              background: activeTab === 'command_board' ? 'rgba(48,50,42,0.3)' : 'rgba(255,255,255,0.07)',
              color: activeTab === 'command_board' ? 'var(--color-onyx-olive)' : 'var(--color-lichen-sage)',
              padding: '1px 5px',
              borderRadius: 4,
            }}>1</kbd>
          </button>

          <button
            id="nav-tab-document-intake"
            onClick={() => setActiveTab('document_intake')}
            className={`tab-btn${activeTab === 'document_intake' ? ' active' : ''}`}
          >
            <FileText size={13} />
            <span>Document Intake</span>
            <kbd style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              background: activeTab === 'document_intake' ? 'rgba(48,50,42,0.3)' : 'rgba(255,255,255,0.07)',
              color: activeTab === 'document_intake' ? 'var(--color-onyx-olive)' : 'var(--color-lichen-sage)',
              padding: '1px 5px',
              borderRadius: 4,
            }}>2</kbd>
          </button>

          <button
            id="nav-tab-agent-trace"
            onClick={() => setActiveTab('agent_trace')}
            className={`tab-btn${activeTab === 'agent_trace' ? ' active' : ''}`}
          >
            <Cpu size={13} />
            <span>Agent Trace</span>
            <kbd style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              background: activeTab === 'agent_trace' ? 'rgba(48,50,42,0.3)' : 'rgba(255,255,255,0.07)',
              color: activeTab === 'agent_trace' ? 'var(--color-onyx-olive)' : 'var(--color-lichen-sage)',
              padding: '1px 5px',
              borderRadius: 4,
            }}>3</kbd>
          </button>
        </nav>

        {/* RIGHT: Status chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Backend status */}
          <button
            onClick={() => refreshFromBackend()}
            title="Click to refresh from backend"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${backendStatus === 'connected' ? 'rgba(104,239,63,0.25)' : 'var(--color-moss-shadow)'}`,
              background: backendStatus === 'connected' ? 'rgba(104,239,63,0.08)' : 'rgba(126,131,113,0.12)',
              color: backendStatus === 'connected' ? 'var(--color-electric-sprout)' : 'var(--color-lichen-sage)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span
              style={{
                width: 7, height: 7,
                borderRadius: '50%',
                background: backendStatus === 'connected' ? 'var(--color-electric-sprout)' : 'var(--color-lichen-sage)',
                flexShrink: 0,
              }}
              className={backendStatus === 'connected' ? 'dot-live' : ''}
            />
            <span className="hidden sm:inline">
              {backendStatus === 'connected' ? 'Backend Live' : 'Mock Mode'}
            </span>
            <RefreshCw size={11} />
          </button>

          {/* Guardrails */}
          <button
            onClick={() => setIsGuardrailsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid rgba(104,239,63,0.2)',
              background: 'rgba(104,239,63,0.06)',
              color: 'var(--color-electric-sprout)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <ShieldCheck size={13} />
            <span className="hidden sm:inline">Guardrails</span>
            <span style={{
              background: 'var(--color-electric-sprout)',
              color: 'var(--color-onyx-olive)',
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 4,
            }}>100%</span>
          </button>

          {/* Alerts */}
          <button
            onClick={() => setIsAlertsDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: unresolvedFlags.length > 0
                ? '1px solid rgba(239,68,68,0.3)'
                : '1px solid var(--color-moss-shadow)',
              background: unresolvedFlags.length > 0
                ? 'rgba(239,68,68,0.08)'
                : 'transparent',
              color: unresolvedFlags.length > 0 ? '#ef4444' : 'var(--color-lichen-sage)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <AlertTriangle
              size={13}
              style={{ animation: unresolvedFlags.length > 0 ? 'pulse 2s infinite' : 'none' }}
            />
            <span>{unresolvedFlags.length} Alert{unresolvedFlags.length !== 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
