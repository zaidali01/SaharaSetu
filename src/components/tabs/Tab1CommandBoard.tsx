import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, Play, Check, MessageSquare, Zap, Pill,
  PhoneCall, ShoppingBag, PhoneForwarded, Layers, ChevronRight,
  ShieldCheck, FileSearch, RefreshCw, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Tab1CommandBoard: React.FC = () => {
  const {
    tasks, approveTask, rejectTask,
    setActiveTranscriptTask, setActiveWhatsAppTask,
    setActiveChemistModalTask, setActiveAuditTask,
    activeParent, backendStatus, refreshFromBackend,
    setIsGuardrailsOpen,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(t => categoryFilter === 'all' || t.category === categoryFilter);
  const doneTasks          = filteredTasks.filter(t => t.column === 'done');
  const needsApprovalTasks = filteredTasks.filter(t => t.column === 'needs_approval');
  const blockedTasks       = filteredTasks.filter(t => t.column === 'blocked');

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medication': return 'Medicine Refill';
      case 'utility':    return 'Utility Bill';
      case 'chemist':    return 'Document Intake';
      case 'checkin':    return 'System Blocker';
      default:           return 'Task';
    }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <p className="page-breadcrumb">Operations / Command Board</p>
          <h1 className="page-title">Operational Command Center</h1>
        </div>
        <div className="page-actions">
          <button
            onClick={() => setIsGuardrailsOpen(true)}
            className="status-pill active"
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-600)', flexShrink: 0 }} />
            Guardrails Active
          </button>
          <button
            onClick={() => refreshFromBackend()}
            className="status-pill"
          >
            <RefreshCw size={13} />
            Sync live data
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Completed Today</p>
          <p className="stat-value">{String(doneTasks.length).padStart(2, '0')}</p>
          <p className="stat-sub green">+2 since 09:00 AM</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Awaiting Sign-Off</p>
          <p className="stat-value">{String(needsApprovalTasks.length).padStart(2, '0')}</p>
          <p className="stat-sub amber">Priority focus required</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Blocked Actions</p>
          <p className="stat-value">{String(blockedTasks.length).padStart(2, '0')}</p>
          <p className="stat-sub muted">Pharmacy stock issue</p>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div className="kanban-grid">

        {/* ── Column 1: Done & Verified ── */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-column-title">Done & Verified</span>
            <span className="kanban-column-badge green">VER: {String(doneTasks.length).padStart(2, '0')}</span>
          </div>

          <AnimatePresence>
            {doneTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="task-card"
              >
                <div className="task-card-header">
                  <span className="task-card-category">{getCategoryLabel(task.category)}</span>
                  <span className="task-card-time">{task.time || '8:15 AM'}</span>
                </div>
                <h4 className="task-card-title">{task.title}</h4>
                {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                {task.verificationMethod && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-inline verified">Verified by Agent</span>
                    <button
                      onClick={() => setActiveAuditTask(task)}
                      className="btn-ghost"
                    >
                      Details
                    </button>
                  </div>
                )}

                {task.amount && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>Auto-paid successfully</span>
                    <span className="btn-ghost" onClick={() => setActiveAuditTask(task)}>Details</span>
                  </div>
                )}

                {task.transcript && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {task.transcript.duration} min IVR
                    </span>
                    <button
                      onClick={() => setActiveTranscriptTask(task)}
                      className="btn-ghost"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Play size={10} fill="currentColor" /> Listen
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Column 2: Needs Approval ── */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-column-title">Needs Approval</span>
            <span className="kanban-column-badge amber">REQ: {String(needsApprovalTasks.length).padStart(2, '0')}</span>
          </div>

          <AnimatePresence>
            {needsApprovalTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className="task-card"
              >
                <div className="task-card-header">
                  <span className="task-card-category">{getCategoryLabel(task.category)}</span>
                  <span className="badge-inline manual-signoff">{task.badgeText || 'Manual Sign-Off'}</span>
                </div>
                <h4 className="task-card-title">{task.title}</h4>
                {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                {/* Amount + Confidence row */}
                {task.amount && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                    <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span className="detail-label">Total Amount</span>
                      <span className="detail-value amount">₹{task.amount.toFixed(2)}</span>
                    </div>
                    <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span className="detail-label">Confidence</span>
                      <span className="detail-value">98% Indic</span>
                    </div>
                  </div>
                )}

                {/* Prescription mini preview */}
                {task.whatsappDraft && (
                  <div className="prescription-mini" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <span>Dr. S. K. Verma</span>
                      <span>Verma Clinic</span>
                    </div>
                    <div>Rx: Amlodipine 5mg (1-0-0), Metformin 500mg (1-0-1), Atorvastatin 10mg (0-0-1)...</div>
                  </div>
                )}

                {task.bookingDetails && (
                  <div style={{ marginTop: 10 }}>
                    <div className="detail-row" style={{ marginBottom: 6 }}>
                      <span className="detail-label">Consumer ID</span>
                      <span className="detail-value mono" style={{ fontSize: 12 }}>{task.bookingDetails.consumerNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Due Date</span>
                      <span style={{ color: 'var(--amber-600)', fontWeight: 600, fontSize: 12 }}>{task.bookingDetails.dueDate}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={() => approveTask(task.id)} className="btn-approve">
                    Approve
                  </button>
                  <button onClick={() => rejectTask(task.id)} className="btn-reject">
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {needsApprovalTasks.length === 0 && (
            <div className="empty-state">✨ Approval queue clear</div>
          )}
        </div>

        {/* ── Column 3: Blocked / Issues ── */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-column-title">Blocked / Issues</span>
            <span className="kanban-column-badge red">ISSUE: {String(blockedTasks.length).padStart(2, '0')}</span>
          </div>

          <AnimatePresence>
            {blockedTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="task-card"
              >
                <div className="task-card-header">
                  <span className="task-card-category">{getCategoryLabel(task.category)}</span>
                  <span className="badge-inline stock-out">{task.badgeText || 'Stock Out'}</span>
                </div>
                <h4 className="task-card-title">{task.title}</h4>
                {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                {task.blockerDetails && (
                  <div className="recommendation-box">
                    <p className="recommendation-label">Recommendation</p>
                    <p className="recommendation-text">{task.blockerDetails.reason}</p>
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  {task.category === 'chemist' && (
                    <button
                      onClick={() => setActiveChemistModalTask(task)}
                      className="btn-danger-fill"
                    >
                      Find alternate chemist <ArrowRight size={14} />
                    </button>
                  )}
                  {task.category === 'checkin' && (
                    <button
                      onClick={() => setActiveAuditTask(task)}
                      className="btn-danger-fill"
                    >
                      <PhoneForwarded size={14} /> Trigger Emergency Ping
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {blockedTasks.length === 0 && (
            <div className="empty-state">🎉 No blockers</div>
          )}
        </div>

      </div>
    </div>
  );
};
