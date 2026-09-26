import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Play, ShieldCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Tab1CommandBoard: React.FC = () => {
  const {
    tasks, approveTask, rejectTask,
    setActiveTranscriptTask, setActiveChemistModalTask, setActiveAuditTask,
    refreshFromBackend,
    setIsGuardrailsOpen,
  } = useApp();

  const doneTasks          = tasks.filter(t => t.column === 'done');
  const needsApprovalTasks = tasks.filter(t => t.column === 'needs_approval');
  const blockedTasks       = tasks.filter(t => t.column === 'blocked');

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medication': return 'MEDICINE REFILL';
      case 'utility':    return 'UTILITY BILL';
      case 'chemist':    return 'DOCUMENT INTAKE';
      case 'checkin':    return 'SYSTEM BLOCKER';
      default:           return 'TASK LOG';
    }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header-container">
        <div>
          <p className="page-breadcrumb">Operations / Command Board</p>
          <h1 className="page-title">Operational Command Center</h1>
        </div>
        <div className="page-actions">
          <button
            onClick={() => setIsGuardrailsOpen(true)}
            className="status-chip active"
          >
            <ShieldCheck size={14} />
            Guardrails Active
          </button>
          <button
            onClick={() => refreshFromBackend()}
            className="btn btn-outline"
          >
            <RefreshCw size={14} />
            Sync Data
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
        <motion.div className="kanban-column col-done"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0 }}
        >
          <div className="kanban-column-header">
            <span className="kanban-column-title">Done & Verified</span>
            <span className="kanban-column-badge">{String(doneTasks.length).padStart(2, '0')}</span>
          </div>

          <AnimatePresence>
            {doneTasks.map(task => (
              <motion.div key={task.id} layout className="task-card">
                <span className="task-eyebrow">{getCategoryLabel(task.category)}</span>
                <div className="task-card-header">
                  <h4 className="task-card-title">{task.title}</h4>
                  <span className="badge badge-success">{task.time || '8:15 AM'}</span>
                </div>
                {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                {task.verificationMethod && (
                  <div className="detail-row">
                    <span className="detail-label">Verified By</span>
                    <span className="detail-value">{task.verificationMethod}</span>
                  </div>
                )}

                {task.amount && (
                  <div className="detail-row">
                    <span className="detail-label">Auto-Paid</span>
                    <span className="detail-value mono">₹{task.amount.toFixed(2)}</span>
                  </div>
                )}

                {task.transcript && (
                  <div className="info-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} /> {task.transcript.duration} min IVR
                    </span>
                    <button onClick={() => setActiveTranscriptTask(task)} className="btn btn-ghost" style={{ padding: '4px 8px' }}>
                      <Play size={12} /> Listen
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── Column 2: Needs Approval ── */}
        <motion.div className="kanban-column col-needs-approval"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <div className="kanban-column-header">
            <span className="kanban-column-title">Needs Approval</span>
            <span className="kanban-column-badge">{String(needsApprovalTasks.length).padStart(2, '0')}</span>
          </div>

          <AnimatePresence>
            {needsApprovalTasks.map(task => (
              <motion.div key={task.id} layout className="task-card">
                <span className="task-eyebrow">{getCategoryLabel(task.category)}</span>
                <div className="task-card-header">
                  <h4 className="task-card-title">{task.title}</h4>
                  <span className="badge badge-review">{task.badgeText || 'Sign-Off'}</span>
                </div>
                {task.subtitle && <p className="task-card-subtitle">{task.subtitle}</p>}

                {task.amount && (
                  <div className="detail-row">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value mono">₹{task.amount.toFixed(2)}</span>
                  </div>
                )}

                {task.bookingDetails && (
                  <div className="info-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="info-label">Consumer ID</span>
                      <span className="detail-value mono">{task.bookingDetails.consumerNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="info-label">Due Date</span>
                      <span style={{ color: 'var(--review-text)', fontWeight: 600, fontSize: 12 }}>{task.bookingDetails.dueDate}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => approveTask(task.id)} className="btn btn-ink" style={{ flex: 1 }}>Approve</button>
                  <button onClick={() => rejectTask(task.id)} className="btn btn-outline" style={{ flex: 1 }}>Reject</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── Column 3: Blocked / Issues ── */}
        <motion.div className="kanban-column col-blocked"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <div className="kanban-column-header">
            <span className="kanban-column-title">Blocked / Issues</span>
            <span className="kanban-column-badge">{String(blockedTasks.length).padStart(2, '0')}</span>
          </div>

          <AnimatePresence>
            {blockedTasks.map(task => (
              <motion.div key={task.id} layout className="task-card">
                <span className="task-eyebrow">{getCategoryLabel(task.category)}</span>
                <div className="task-card-header">
                  <h4 className="task-card-title">{task.title}</h4>
                  <span className="badge badge-alert">{task.badgeText || 'Blocked'}</span>
                </div>
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
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
};
