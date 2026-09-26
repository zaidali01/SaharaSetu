import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Languages, Activity, Store, Zap, Flame, User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ParentProfileModal: React.FC = () => {
  const { isParentProfileOpen, setIsParentProfileOpen, activeParent, setActiveParent, parents } = useApp();

  if (!isParentProfileOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(36, 51, 43, 0.4)', backdropFilter: 'blur(4px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', boxShadow: '0 24px 48px rgba(36,51,43,0.18)', border: '1px solid var(--border-light)', width: '100%', maxWidth: 640, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', background: 'var(--sidebar-bg)', color: 'var(--text-on-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--sidebar-active-bg)', border: '1px solid rgba(250,247,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} color="var(--text-on-dark)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>{activeParent.name}</h3>
                  <span className="mono" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(250,247,240,0.15)', color: 'var(--text-on-dark)' }}>
                    AGE {activeParent.age} • {activeParent.relation.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted-on-dark-60)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} /> {activeParent.address}, {activeParent.city} ({activeParent.pincode})
                </p>
              </div>
            </div>
            <button onClick={() => setIsParentProfileOpen(false)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'rgba(250,247,240,0.1)', border: 'none', color: 'var(--text-on-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14 }}>
            {/* Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-muted)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-ink)', fontSize: 13 }}>Switch Monitored Parent:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {parents.map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => setActiveParent(parent)}
                    style={{
                      padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-light)', transition: 'all 0.15s',
                      background: activeParent.id === parent.id ? 'var(--terracotta)' : 'var(--card-bg)',
                      color: activeParent.id === parent.id ? '#fff' : 'var(--text-ink)',
                    }}
                  >
                    {parent.name} ({parent.location.split(',')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Vitals */}
            <div style={{ padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.05em' }}>
                  <Activity size={16} color="var(--terracotta)" /> LATEST HEALTH VITALS
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeParent.vitals.lastChecked}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Blood Pressure', value: activeParent.vitals.bloodPressure },
                  { label: 'Fasting Sugar', value: activeParent.vitals.bloodSugarFasting },
                  { label: 'Pulse Rate', value: activeParent.vitals.pulseRate },
                ].map((v, i) => (
                  <div key={i} style={{ background: 'var(--surface-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{v.label}</span>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text-ink)', marginTop: 4 }}>{v.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Language */}
            <div style={{ padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--card-bg)' }}>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, letterSpacing: '0.05em' }}>
                <Languages size={16} color="var(--ink)" /> SARVAM VOICE AGENT LOCALIZATION
              </span>
              <p style={{ color: 'var(--text-ink)' }}>Primary: <strong>{activeParent.preferredLanguage}</strong> with fluency in <strong>{activeParent.secondaryLanguage}</strong>.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {activeParent.dialects.map((d, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, background: 'var(--surface-muted)', color: 'var(--text-ink)', border: '1px solid var(--border-light)' }}>
                    {d} Acoustic Model v2
                  </span>
                ))}
              </div>
            </div>

            {/* Vendors */}
            <div>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>GROUNDED LOCAL VENDOR REGISTRY</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { icon: <Store size={16} />, label: 'Pharmacy', name: activeParent.vendors.chemist.name, sub: activeParent.vendors.chemist.area, detail: activeParent.vendors.chemist.phone, color: 'var(--success)' },
                  { icon: <Flame size={16} />, label: 'LPG Gas', name: activeParent.vendors.lpg.provider, sub: activeParent.vendors.lpg.agency, detail: `Ref: ${activeParent.vendors.lpg.consumerNo}`, color: 'var(--terracotta)' },
                  { icon: <Zap size={16} />, label: 'Electricity', name: activeParent.vendors.electricity.provider, sub: 'Auto-Mandate active', detail: `ID: ${activeParent.vendors.electricity.consumerId}`, color: 'var(--mustard)' },
                ].map((v, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: v.color, marginBottom: 8, fontSize: 13, fontFamily: 'var(--font-heading)' }}>
                      {v.icon} {v.label}
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--text-ink)', fontSize: 14 }}>{v.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v.sub}</p>
                    <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{v.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>EMERGENCY ESCALATION TREE</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeParent.emergencyContacts.map((c, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-ink)' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({c.relation} • {c.location})</span>
                    </div>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text-ink)', fontSize: 13 }}>{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-muted)' }}>
            <button onClick={() => setIsParentProfileOpen(false)} className="btn btn-primary">Done</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
