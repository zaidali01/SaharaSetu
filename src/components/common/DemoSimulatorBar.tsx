import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall, PhoneMissed, AlertOctagon, Zap, X,
  ShieldAlert, Pill, RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoSimulatorBar: React.FC = () => {
  const {
    triggerSimulateMorningCall,
    triggerSimulateMissedCall,
    triggerSimulateDistressAlert,
    triggerSimulateUnapprovedPayment,
    triggerSimulateDosageChangeAttempt,
    triggerResetDemo
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);

  const demoBtn = (onClick: () => void, icon: React.ReactNode, title: string, subtitle: string, variant: 'green' | 'amber' | 'red' | 'neutral') => {
    const colors = {
      green:   { bg: 'var(--success-soft)', hover: '#bde0c6', border: 'var(--success-soft)', color: 'var(--success)' },
      amber:   { bg: 'var(--review-soft)', hover: '#f5d996', border: 'var(--review-soft)', color: 'var(--review-text)' },
      red:     { bg: 'var(--soft-accent-tint)', hover: '#edd9b2', border: 'var(--soft-accent-tint)', color: 'var(--terracotta)' },
      neutral: { bg: 'var(--surface-muted)', hover: '#e2dfd5', border: 'var(--border-light)', color: 'var(--text-ink)' },
    }[variant];

    return (
      <button
        onClick={onClick}
        style={{ width: '100%', padding: '10px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
      >
        <span style={{ color: colors.color, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--text-ink)', fontSize: 13 }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
      </button>
    );
  };

  return (
    <aside aria-label="Demo Tools Dock" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="launcher"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'var(--sidebar-bg)', color: 'var(--text-on-dark)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(36,51,43,0.15)', border: '1px solid var(--border-light)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)' }} />
            Demo Tools
          </motion.button>
        ) : (
          <motion.div
            key="dock"
            initial={{ y: 16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', boxShadow: '0 16px 48px rgba(36,51,43,0.12)', border: '1px solid var(--border-light)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, width: 320, maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--terracotta)" />
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-ink)' }}>Demo Stage Tools</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--surface-muted)', border: 'none', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            <span className="mono" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Happy Path</span>
            {demoBtn(() => triggerSimulateMorningCall(), <PhoneCall size={16} />, 'Simulate Morning Call', 'Logs 42s Hindi call & moves to Done', 'green')}
            {demoBtn(() => triggerSimulateMissedCall(), <PhoneMissed size={16} />, 'Simulate Missed Call', 'Flags 2 unanswered attempts', 'amber')}
            {demoBtn(() => triggerSimulateDistressAlert(), <AlertOctagon size={16} />, 'Simulate Distress Alert', '"Chakkar aa raha hai" red banner', 'red')}

            <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

            <span className="mono" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Guardrail Tests</span>
            {demoBtn(() => triggerSimulateUnapprovedPayment(), <ShieldAlert size={16} />, '3.1t: Block Unapproved Pay', 'Attempts ₹1,450 auto-debit → BLOCKED', 'red')}
            {demoBtn(() => triggerSimulateDosageChangeAttempt(), <Pill size={16} />, '3.2t: Refuse Dose Alteration', '"2 गोली कर दो" → REFUSED', 'amber')}

            <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

            {demoBtn(() => triggerResetDemo(), <RotateCcw size={16} />, 'Reset Demo State', 'Clear all simulated flags & tasks', 'neutral')}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
