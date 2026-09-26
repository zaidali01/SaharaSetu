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

  const demoBtn = (onClick: () => void, icon: React.ReactNode, title: string, subtitle: string, variant: 'green' | 'amber' | 'red' | 'orange' | 'neutral') => {
    const colors = {
      green:   { bg: 'var(--green-50)', hover: 'var(--green-100)', border: 'var(--green-100)', color: 'var(--green-600)' },
      amber:   { bg: 'var(--amber-50)', hover: 'var(--amber-100)', border: 'var(--amber-100)', color: 'var(--amber-600)' },
      red:     { bg: 'var(--red-50)', hover: 'var(--red-100)', border: 'var(--red-100)', color: 'var(--red-600)' },
      orange:  { bg: '#fff7ed', hover: '#ffedd5', border: '#fed7aa', color: '#c2410c' },
      neutral: { bg: 'var(--content-bg)', hover: '#e5e7eb', border: 'var(--card-border)', color: 'var(--text-secondary)' },
    }[variant];

    return (
      <button
        onClick={onClick}
        style={{ width: '100%', padding: '8px 12px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' }}
      >
        <span style={{ color: colors.color, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{subtitle}</div>
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
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--sidebar-bg)', color: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: '1px solid var(--sidebar-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sprout)' }} />
            <Zap size={13} color="var(--sprout)" />
            Demo Tools
          </motion.button>
        ) : (
          <motion.div
            key="dock"
            initial={{ y: 16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{ background: '#fff', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', border: '1px solid var(--card-border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, width: 280, maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="var(--accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>Demo Stage Tools</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--content-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={13} />
              </button>
            </div>

            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Happy Path</span>
            {demoBtn(() => triggerSimulateMorningCall(), <PhoneCall size={14} />, 'Simulate Morning Call', 'Logs 42s Hindi call & moves to Done', 'green')}
            {demoBtn(() => triggerSimulateMissedCall(), <PhoneMissed size={14} />, 'Simulate Missed Call', 'Flags 2 unanswered attempts', 'amber')}
            {demoBtn(() => triggerSimulateDistressAlert(), <AlertOctagon size={14} />, 'Simulate Distress Alert', '"Chakkar aa raha hai" red banner', 'red')}

            <div style={{ borderTop: '1px solid var(--card-border)', margin: '2px 0' }} />

            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red-600)' }}>Guardrail Tests</span>
            {demoBtn(() => triggerSimulateUnapprovedPayment(), <ShieldAlert size={14} />, '3.1t: Block Unapproved Pay', 'Attempts ₹1,450 auto-debit → BLOCKED', 'red')}
            {demoBtn(() => triggerSimulateDosageChangeAttempt(), <Pill size={14} />, '3.2t: Refuse Dose Alteration', '"2 गोली कर दो" → REFUSED', 'orange')}

            <div style={{ borderTop: '1px solid var(--card-border)', margin: '2px 0' }} />

            {demoBtn(() => triggerResetDemo(), <RotateCcw size={14} />, 'Reset Demo State', 'Clear all simulated flags & tasks', 'neutral')}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
