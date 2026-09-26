import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle,
  Pill,
  Zap,
  ShoppingBag,
  Heart,
  PhoneCall,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Send,
  MapPin,
  Inbox,
  Ban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmptyState, SkeletonBoard } from '../common/EmptyState';

export const Tab1CommandBoard: React.FC = () => {
  const {
    tasks, 
    approveTask, 
    rejectTask,
    activeParent,
    setActiveTranscriptTask, 
    setActiveWhatsAppTask,
    setActiveChemistModalTask, 
    setActiveAuditTask,
    refreshFromBackend,
    isSyncing,
    hasHydrated,
    setIsGuardrailsOpen,
    setIsParentProfileOpen
  } = useApp();

  const doneTasks          = tasks.filter(t => t.column === 'done');
  const needsApprovalTasks = tasks.filter(t => t.column === 'needs_approval');
  const blockedTasks       = tasks.filter(t => t.column === 'blocked');

  const isMother = activeParent.relation.toLowerCase().includes('mother');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication': return <Pill size={14} className="text-emerald-700" />;
      case 'utility':    return <Zap size={14} className="text-amber-700" />;
      case 'chemist':    return <ShoppingBag size={14} className="text-blue-700" />;
      case 'checkin':    return <Heart size={14} className="text-rose-700" />;
      default:           return <Calendar size={14} className="text-slate-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medication': return 'MEDICATION ADHERENCE';
      case 'utility':    return 'UTILITY AUTOPAY';
      case 'chemist':    return 'PHARMACY DISPATCH';
      case 'checkin':    return 'WELLNESS CHECK';
      default:           return 'ROUTINE SCHEDULE';
    }
  };

  // Day Milestone Timeline
  const milestones = [
    { time: '8:15 AM', label: isMother ? 'Thyroid 50mcg' : 'BP (Amlodipine)', status: 'done', note: 'Voice Confirmed (0:34)' },
    { time: '11:00 AM', label: 'Electricity Bill', status: 'done', note: 'UPI Mandate ₹1,420' },
    { time: '11:30 AM', label: 'LPG Gas Refill', status: 'done', note: 'Doorstep Delivered' },
    { time: '5:00 PM', label: 'Chemist Refill', status: 'pending', note: 'Sign-off Required' },
    { time: '10:00 PM', label: 'Bedtime Statin', status: 'upcoming', note: 'Scheduled' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* ── Editorial Family Hero Briefing Banner ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--surface-muted) 100%)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-light)',
          padding: '22px 26px',
          boxShadow: '0 4px 20px rgba(36, 51, 43, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          
          {/* Left: Parent Info & Emotional Care Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div 
              onClick={() => setIsParentProfileOpen(true)}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--sidebar-bg, #24332b)',
                color: 'var(--text-on-dark, #fdfbf7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(36, 51, 43, 0.15)',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Click to view full medical profile"
            >
              {activeParent.name.charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--text-ink)', margin: 0 }}>
                  {activeParent.name}
                </h1>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({activeParent.relation}, {activeParent.age} yrs)
                </span>
                <span className="status-chip active" style={{ padding: '3px 8px', fontSize: 11 }}>
                  <CheckCircle2 size={12} /> All Vitals Stable
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} color="var(--terracotta)" /> {activeParent.city}
                </span>
                <span>•</span>
                <span>Language: <strong style={{ color: 'var(--text-ink)' }}>{activeParent.preferredLanguage.split('/')[0].trim()}</strong></span>
                <span>•</span>
                <span>Last Call: <strong style={{ color: 'var(--success)' }}>Today 8:15 AM</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Quick Guardrail & Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsGuardrailsOpen(true)}
              className="status-chip active"
              style={{ cursor: 'pointer' }}
            >
              <ShieldCheck size={14} />
              Policy Engine Active
            </button>
            <button
              onClick={() => refreshFromBackend()}
              className="btn btn-outline"
              disabled={isSyncing}
              aria-busy={isSyncing}
              style={{ padding: '8px 14px', fontSize: 12 }}
            >
              <RefreshCw size={13} className={isSyncing ? 'spin' : undefined} />
              {isSyncing ? 'Syncing' : 'Sync State'}
            </button>
          </div>

        </div>

        {/* Horizontal Day Milestones Timeline */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today's Care Sequence Timeline
            </span>
            <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
              3 of 5 Milestones Completed
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            {milestones.map((m, idx) => (
              <div 
                key={idx}
                style={{
                  background: m.status === 'done' 
                    ? 'var(--success-soft, #e8f5ec)' 
                    : m.status === 'pending' 
                    ? 'var(--review-soft, #fef3d6)' 
                    : 'var(--surface-muted, #f4f2eb)',
                  borderRadius: 'var(--radius-sm, 8px)',
                  padding: '10px 12px',
                  border: m.status === 'pending' ? '1px dashed #d97706' : '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: m.status === 'done' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {m.time}
                  </span>
                  {m.status === 'done' && <CheckCircle2 size={12} color="var(--success)" />}
                  {m.status === 'pending' && <span className="badge badge-review" style={{ fontSize: 9, padding: '1px 5px' }}>Action</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.note}
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>

      {/* ── Kanban 3-Column Task Stream ── */}
      {hasHydrated ? (
        <div className="kanban-grid">

          {/* ── Column 1: Done & Verified ── */}
          <motion.div className="kanban-column col-done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-title">Done & Verified</span>
              <span className="kanban-column-badge">{String(doneTasks.length).padStart(2, '0')}</span>
            </div>

            <AnimatePresence>
              {doneTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={16} />}
                  title="Nothing completed yet"
                  body="Approved refills, gas bookings and payments land here with a full audit trail."
                />
              ) : (
                doneTasks.map(task => (
                  <motion.div key={task.id} layout className="task-card" style={{ transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="task-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getCategoryIcon(task.category)}
                        {getCategoryLabel(task.category)}
                      </span>
                      <span className="badge badge-success">{task.time || '8:15 AM'}</span>
                    </div>

                    <h4 className="task-card-title">{task.title}</h4>
                    {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                    {task.verificationMethod && (
                      <div className="detail-row" style={{ marginTop: 10 }}>
                        <span className="detail-label">Verification</span>
                        <span className="detail-value" style={{ color: 'var(--success)', fontWeight: 600 }}>
                          {task.verificationMethod}
                        </span>
                      </div>
                    )}

                    {task.amount && (
                      <div className="detail-row">
                        <span className="detail-label">Auto-Paid</span>
                        <span className="detail-value mono font-bold">₹{task.amount.toFixed(2)}</span>
                      </div>
                    )}

                    {task.transcript && (
                      <div className="info-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PhoneCall size={13} color="var(--success)" /> {task.transcript.duration} min Indic STT
                        </span>
                        <button 
                          onClick={() => setActiveTranscriptTask(task)} 
                          className="btn btn-ghost" 
                          style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Play size={11} /> Play Recording
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Column 2: Needs Approval ── */}
          <motion.div className="kanban-column col-needs-approval"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-title">Needs Your Approval</span>
              <span className="kanban-column-badge">{String(needsApprovalTasks.length).padStart(2, '0')}</span>
            </div>

            <AnimatePresence>
              {needsApprovalTasks.length === 0 ? (
                <EmptyState
                  icon={<Inbox size={16} />}
                  title="Queue is clear"
                  body="Refill thresholds, gas cycles and any payment needing sign-off will surface here."
                />
              ) : (
                needsApprovalTasks.map(task => (
                  <motion.div key={task.id} layout className="task-card" style={{ border: '1px solid #f59e0b', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="task-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getCategoryIcon(task.category)}
                        {getCategoryLabel(task.category)}
                      </span>
                      <span className="badge badge-review">{task.badgeText || 'Manual Sign-Off'}</span>
                    </div>

                    <h4 className="task-card-title">{task.title}</h4>
                    {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                    {task.amount && (
                      <div className="detail-row" style={{ marginTop: 10 }}>
                        <span className="detail-label">Authorized Total</span>
                        <span className="detail-value mono font-bold" style={{ fontSize: 14, color: 'var(--text-ink)' }}>
                          ₹{task.amount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {task.whatsappDraft && (
                      <div className="info-box" style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span className="info-label">Partner Chemist</span>
                          <span className="detail-value font-bold">{task.whatsappDraft.shopName.split(',')[0]}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Pre-formatted bilingual order ready for WhatsApp Web dispatch.
                        </div>
                        <button
                          onClick={() => setActiveWhatsAppTask(task)}
                          style={{
                            width: '100%',
                            marginTop: 8,
                            padding: '6px 10px',
                            background: '#e8f5ec',
                            border: '1px solid #bde0c6',
                            borderRadius: 'var(--radius-sm, 6px)',
                            color: '#075e54',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <MessageSquare size={12} />
                          Preview WhatsApp Order Draft
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button onClick={() => approveTask(task.id)} className="btn btn-ink" style={{ flex: 1 }}>
                        <Send size={12} /> Approve & Dispatch
                      </button>
                      <button onClick={() => rejectTask(task.id)} className="btn btn-outline" style={{ flex: 0.8 }}>
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Column 3: Blocked / Issues ── */}
          <motion.div className="kanban-column col-blocked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-title">Blocked / Attention</span>
              <span className="kanban-column-badge">{String(blockedTasks.length).padStart(2, '0')}</span>
            </div>

            <AnimatePresence>
              {blockedTasks.length === 0 ? (
                <EmptyState
                  icon={<Ban size={16} />}
                  title="No blockers"
                  body="Nothing is stuck. A blocked refill or failed check-in would appear here."
                />
              ) : (
                blockedTasks.map(task => (
                  <motion.div key={task.id} layout className="task-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="task-eyebrow">{getCategoryLabel(task.category)}</span>
                      <span className="badge badge-alert">{task.badgeText || 'Blocked'}</span>
                    </div>

                    <h4 className="task-card-title">{task.title}</h4>
                    {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                    {task.blockerDetails && (
                      <div className="info-box">
                        <p className="info-label">Reason</p>
                        <p className="info-text">{task.blockerDetails.reason}</p>
                      </div>
                    )}

                    <div style={{ marginTop: 16 }}>
                      {task.category === 'chemist' && (
                        <button onClick={() => setActiveChemistModalTask(task)} className="btn btn-primary" style={{ width: '100%' }}>
                          Find Alternate Chemist
                        </button>
                      )}
                      {task.category === 'checkin' && (
                        <button onClick={() => setActiveAuditTask(task)} className="btn btn-primary" style={{ width: '100%' }}>
                          <AlertCircle size={14} /> Emergency Ping
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      ) : (
        <SkeletonBoard />
      )}
    </div>
  );
};
