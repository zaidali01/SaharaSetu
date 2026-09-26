import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, Play, Check, MessageSquare, Zap, Pill,
  PhoneCall, ShoppingBag, PhoneForwarded, Layers, ChevronRight,
  ShieldCheck, CheckCircle, FileSearch, Activity, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/* ─── Shared card style ─────────────────────────────────── */
const C = {
  dark:     'var(--color-forest-depths)',
  surface:  'var(--color-moss-shadow)',
  border:   'var(--color-moss-shadow)',
  sprout:   'var(--color-electric-sprout)',
  sage:     'var(--color-lichen-sage)',
  white:    'var(--color-pure-white)',
  bone:     'var(--color-bone-white)',
  onyx:     'var(--color-onyx-olive)',
  fern:     'var(--color-pale-fern)',
  wash:     'var(--color-sprout-wash)',
};

const colWell: React.CSSProperties = {
  background: 'rgba(39,63,43,0.28)',
  border: '1px solid rgba(39,63,43,0.6)',
  borderRadius: 20,
  padding: 16,
  minHeight: 600,
};

const taskCard: React.CSSProperties = {
  background: 'rgba(18,35,20,0.85)',
  border: '1px solid var(--color-moss-shadow)',
  borderRadius: 16,
  padding: 16,
  cursor: 'grab',
  backdropFilter: 'blur(8px)',
};

export const Tab1CommandBoard: React.FC = () => {
  const {
    tasks, approveTask, rejectTask,
    setActiveTranscriptTask, setActiveWhatsAppTask,
    setActiveChemistModalTask, setActiveAuditTask,
    activeParent, backendStatus, refreshFromBackend,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(t => categoryFilter === 'all' || t.category === categoryFilter);
  const doneTasks           = filteredTasks.filter(t => t.column === 'done');
  const needsApprovalTasks  = filteredTasks.filter(t => t.column === 'needs_approval');
  const blockedTasks        = filteredTasks.filter(t => t.column === 'blocked');
  const pendingFunds        = needsApprovalTasks.reduce((acc, t) => acc + (t.amount || 0), 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication': return <Pill size={14} color="var(--color-electric-sprout)" />;
      case 'utility':    return <Zap size={14} color="#f59e0b" />;
      case 'chemist':    return <ShoppingBag size={14} color="var(--color-electric-sprout)" />;
      case 'checkin':    return <PhoneCall size={14} color="#ef4444" />;
      default:           return <Layers size={14} color="var(--color-lichen-sage)" />;
    }
  };

  const filters = [
    { id: 'all', label: 'All Tasks' },
    { id: 'medication', label: 'Medications' },
    { id: 'chemist', label: 'Chemist' },
    { id: 'utility', label: 'Utilities' },
    { id: 'checkin', label: 'Voice Calls' },
  ];

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: C.white, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Command <span style={{ color: C.sprout }}>Board</span>
          </h1>
          <span className="badge badge-sage" style={{ fontSize: 11 }}>Tasks 4.3–4.5</span>
        </div>
        <p style={{ color: C.sage, fontSize: 14 }}>
          Live operations for <strong style={{ color: C.white }}>{activeParent.name}</strong> · {activeParent.city || 'Patna'} · {activeParent.preferredLanguage || 'Hindi'}
        </p>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: 'Completed Today', value: `${doneTasks.length} done`, sub: `+1 confirmed`, icon: <CheckCircle size={16} color={C.sprout} />, accent: C.sprout },
          { label: 'Awaiting Sign-off', value: `₹${pendingFunds > 0 ? pendingFunds.toFixed(0) : '1,252'}`, sub: `${needsApprovalTasks.length} in queue`, icon: <ShieldCheck size={16} color="#f59e0b" />, accent: '#f59e0b' },
          { label: 'Next Check-in', value: `8:00 PM`, sub: 'Dinner Call · Sarvam IVR', icon: <Activity size={16} color={C.sprout} />, accent: C.sprout },
        ].map((stat, i) => (
          <div key={i} style={{ ...taskCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.sage, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{stat.label}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{stat.value}</span>
              <span style={{ fontSize: 12, color: C.sage }}>{stat.sub}</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${stat.accent}30`, background: `${stat.accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: categoryFilter === f.id ? 'none' : '1px solid var(--color-moss-shadow)',
                background: categoryFilter === f.id ? C.sprout : 'transparent',
                color: categoryFilter === f.id ? C.onyx : C.sage,
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refreshFromBackend()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-moss-shadow)', background: 'transparent', color: C.sage, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
        >
          <RefreshCw size={12} />
          Sync · {backendStatus === 'connected' ? 'Live' : 'Cached'}
        </button>
      </div>

      {/* ── Tri-column Kanban ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>

        {/* ─ COLUMN 1: Done & Verified ─ */}
        <div style={colWell}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.sprout, display: 'inline-block' }} />
              <span style={{ fontWeight: 600, fontSize: 12, color: C.fern, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Done & Verified</span>
            </div>
            <span className="badge badge-sprout">{doneTasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {doneTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={taskCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(104,239,63,0.1)', border: '1px solid rgba(104,239,63,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>{task.title}</h4>
                        {task.subtitle && <p style={{ fontSize: 12, color: C.sage, marginTop: 2 }}>{task.subtitle}</p>}
                      </div>
                    </div>
                    <span className="badge badge-sprout" style={{ fontSize: 10, flexShrink: 0 }}>
                      <CheckCircle2 size={10} /> {task.badgeText || 'Done'}
                    </span>
                  </div>

                  {task.verificationMethod && (
                    <div style={{ background: 'rgba(39,63,43,0.5)', border: '1px solid var(--color-moss-shadow)', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: C.fern }}>{task.verificationMethod}</span>
                      <span style={{ color: C.sage, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{task.time}</span>
                    </div>
                  )}

                  {task.amount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: 8, borderTop: '1px solid var(--color-moss-shadow)' }}>
                      <span style={{ color: C.sage }}>Auto-Mandate BBPS:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.white }}>₹{task.amount.toFixed(2)}</span>
                    </div>
                  )}

                  {task.transcript && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--color-moss-shadow)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.sage, fontSize: 12 }}>
                        <Clock size={12} /> {task.transcript.duration} min IVR
                      </div>
                      <button
                        onClick={() => setActiveTranscriptTask(task)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(104,239,63,0.1)', border: '1px solid rgba(104,239,63,0.2)', color: C.sprout, fontSize: 12, cursor: 'pointer' }}
                      >
                        <Play size={10} fill="currentColor" /> Listen
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ─ COLUMN 2: Needs Approval ─ */}
        <div style={colWell}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, fontSize: 12, color: C.fern, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Needs Approval</span>
            </div>
            <span className="badge badge-amber">{needsApprovalTasks.length} Pending</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {needsApprovalTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -16 }} style={taskCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>{task.title}</h4>
                        {task.subtitle && <p style={{ fontSize: 12, color: C.sage, marginTop: 2 }}>{task.subtitle}</p>}
                      </div>
                    </div>
                    <span className="badge badge-amber" style={{ fontSize: 10, flexShrink: 0 }}>{task.badgeText || 'Sign-off'}</span>
                  </div>

                  {task.amount && (
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
                      <span style={{ color: C.sage }}>Order Amount:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.white, fontSize: 15 }}>₹{task.amount.toFixed(2)}</span>
                    </div>
                  )}

                  {task.whatsappDraft && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <button onClick={() => setActiveWhatsAppTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sprout, fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <MessageSquare size={13} /> Preview WhatsApp Draft <ChevronRight size={12} />
                      </button>
                      <button onClick={() => setActiveAuditTask(task)} style={{ fontSize: 11, color: C.sage, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileSearch size={11} /> Audit
                      </button>
                    </div>
                  )}

                  {task.bookingDetails && (
                    <div style={{ background: 'rgba(39,63,43,0.5)', border: '1px solid var(--color-moss-shadow)', borderRadius: 10, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: C.sage }}>Consumer ID:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: C.white, fontWeight: 600 }}>{task.bookingDetails.consumerNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: C.sage }}>Due:</span>
                        <span style={{ color: '#f59e0b', fontWeight: 500 }}>{task.bookingDetails.dueDate}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--color-moss-shadow)' }}>
                    <button onClick={() => rejectTask(task.id)} className="btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}>
                      Reject
                    </button>
                    <button onClick={() => approveTask(task.id)} className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 12, padding: '7px 14px', borderRadius: 8 }}>
                      <Check size={13} /> {task.category === 'chemist' ? 'Approve & Dispatch' : 'Approve'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {needsApprovalTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--color-moss-shadow)', borderRadius: 14, color: C.sage, fontSize: 13 }}>
                ✨ Approval queue clear
              </div>
            )}
          </div>
        </div>

        {/* ─ COLUMN 3: Blocked ─ */}
        <div style={colWell}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, fontSize: 12, color: C.fern, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Couldn't Complete</span>
            </div>
            <span className="badge badge-red">{blockedTasks.length} Issues</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {blockedTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={taskCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>{task.title}</h4>
                        {task.subtitle && <p style={{ fontSize: 12, color: C.sage, marginTop: 2 }}>{task.subtitle}</p>}
                      </div>
                    </div>
                    <span className="badge badge-red" style={{ fontSize: 10, flexShrink: 0 }}>{task.badgeText || 'Blocked'}</span>
                  </div>

                  {task.blockerDetails && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>
                      <p style={{ color: C.fern, lineHeight: 1.5, marginBottom: 6 }}>{task.blockerDetails.reason}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.sage, fontFamily: 'var(--font-mono)', paddingTop: 6, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                        <span>Attempts: {task.blockerDetails.attempts}</span>
                        <span>{task.blockerDetails.lastAttemptTime}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-moss-shadow)' }}>
                    {task.category === 'chemist' && (
                      <button onClick={() => setActiveChemistModalTask(task)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px 14px', borderRadius: 8 }}>
                        <ShoppingBag size={13} /> Find Alternate Chemist
                      </button>
                    )}
                    {task.category === 'checkin' && (
                      <button onClick={() => setActiveAuditTask(task)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                        <PhoneForwarded size={13} /> Trigger Emergency Ping
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {blockedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--color-moss-shadow)', borderRadius: 14, color: C.sage, fontSize: 13 }}>
                🎉 No blockers
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
