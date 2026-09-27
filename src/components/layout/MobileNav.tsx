import React from 'react';
import { Layers, FileText, Cpu, ShieldCheck, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsGuardrailsOpen,
    setIsParentProfileOpen,
    documents,
    activeParent
  } = useApp();

  const pendingDocs = documents.filter(d => d.status === 'pending_review' || d.status === 'processed').length;

  return (
    <>
      {/* ── Top Mobile App Header ── */}
      <header 
        className="mobile-top-bar"
        style={{
          display: 'none', // Controlled via CSS media query
          position: 'sticky',
          top: 0,
          zIndex: 35,
          background: 'var(--sidebar-bg, #24332B)',
          color: 'var(--text-on-dark, #FAF7F0)',
          padding: '10px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div 
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--terracotta)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14
            }}
          >
            S
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#fff' }}>
            SaharaSetu
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsGuardrailsOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              padding: '5px 8px',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={13} color="var(--mustard)" />
            <span>Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setIsParentProfileOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <div 
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--terracotta)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12
              }}
            >
              {activeParent.name.charAt(0)}
            </div>
          </button>
        </div>
      </header>

      {/* ── Fixed Bottom Mobile Navigation Bar ── */}
      <nav
        className="mobile-bottom-bar"
        style={{
          display: 'none', // Controlled via CSS media query
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 45,
          background: 'var(--sidebar-bg, #24332B)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding: '6px 12px 10px',
          alignItems: 'center',
          justifyContent: 'space-around',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.2)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('command_board')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: activeTab === 'command_board' ? 'var(--mustard, #E6B84B)' : 'rgba(250, 247, 240, 0.6)',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <Layers size={18} />
          <span style={{ fontSize: 10, fontWeight: activeTab === 'command_board' ? 700 : 500 }}>Command</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('document_intake')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: activeTab === 'document_intake' ? 'var(--mustard, #E6B84B)' : 'rgba(250, 247, 240, 0.6)',
            cursor: 'pointer',
            flex: 1,
            position: 'relative'
          }}
        >
          <FileText size={18} />
          <span style={{ fontSize: 10, fontWeight: activeTab === 'document_intake' ? 700 : 500 }}>OCR Rx</span>
          {pendingDocs > 0 && (
            <span 
              style={{
                position: 'absolute',
                top: -2,
                right: '25%',
                background: 'var(--terracotta)',
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                width: 15,
                height: 15,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {pendingDocs}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agent_trace')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: activeTab === 'agent_trace' ? 'var(--mustard, #E6B84B)' : 'rgba(250, 247, 240, 0.6)',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <Cpu size={18} />
          <span style={{ fontSize: 10, fontWeight: activeTab === 'agent_trace' ? 700 : 500 }}>Agents</span>
        </button>

        <button
          type="button"
          onClick={() => setIsParentProfileOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: 'rgba(250, 247, 240, 0.6)',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <User size={18} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Profile</span>
        </button>
      </nav>
    </>
  );
};
