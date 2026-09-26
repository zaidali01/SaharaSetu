import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Languages, Activity, Store, Zap, Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ParentProfileModal: React.FC = () => {
  const { isParentProfileOpen, setIsParentProfileOpen, activeParent, setActiveParent, parents } = useApp();

  if (!isParentProfileOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,0.18)', border: '1px solid var(--card-border)', width: '100%', maxWidth: 640, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        >
          {/* Header */}
          <div style={{ padding: '16px 24px', background: 'var(--sidebar-bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sidebar-hover)', border: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👴</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{activeParent.name}</h3>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    Age {activeParent.age} • {activeParent.relation}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {activeParent.address}, {activeParent.city} ({activeParent.pincode})
                </p>
              </div>
            </div>
            <button onClick={() => setIsParentProfileOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
            {/* Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--content-bg)', padding: '8px 12px', borderRadius: 10 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Switch Monitored Parent:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {parents.map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => setActiveParent(parent)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      background: activeParent.id === parent.id ? 'var(--sidebar-bg)' : '#fff',
                      color: activeParent.id === parent.id ? '#fff' : 'var(--text-secondary)',
                      boxShadow: activeParent.id === parent.id ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {parent.name} ({parent.location.split(',')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Vitals */}
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--content-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={14} color="var(--accent)" /> Latest Health Vitals
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeParent.vitals.lastChecked}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Blood Pressure', value: activeParent.vitals.bloodPressure },
                  { label: 'Fasting Sugar', value: activeParent.vitals.bloodSugarFasting },
                  { label: 'Pulse Rate', value: activeParent.vitals.pulseRate },
                ].map((v, i) => (
                  <div key={i} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid var(--card-border)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{v.label}</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{v.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Language */}
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--content-bg)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Languages size={14} color="var(--blue-600)" /> Sarvam Voice Agent Localization
              </span>
              <p style={{ color: 'var(--text-secondary)' }}>Primary: <strong>{activeParent.preferredLanguage}</strong> with fluency in <strong>{activeParent.secondaryLanguage}</strong>.</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {activeParent.dialects.map((d, i) => (
                  <span key={i} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                    {d} Acoustic Model v2
                  </span>
                ))}
              </div>
            </div>

            {/* Vendors */}
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Grounded Local Vendor Registry</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
                {[
                  { icon: <Store size={14} />, label: 'Pharmacy', name: activeParent.vendors.chemist.name, sub: activeParent.vendors.chemist.area, detail: activeParent.vendors.chemist.phone, color: 'var(--accent)' },
                  { icon: <Flame size={14} />, label: 'LPG Gas', name: activeParent.vendors.lpg.provider, sub: activeParent.vendors.lpg.agency, detail: `Ref: ${activeParent.vendors.lpg.consumerNo}`, color: 'var(--amber-600)' },
                  { icon: <Zap size={14} />, label: 'Electricity', name: activeParent.vendors.electricity.provider, sub: 'Auto-Mandate active', detail: `ID: ${activeParent.vendors.electricity.consumerId}`, color: 'var(--blue-600)' },
                ].map((v, i) => (
                  <div key={i} style={{ padding: 12, background: '#fff', borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: v.color, marginBottom: 6, fontSize: 12 }}>
                      {v.icon} {v.label}
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{v.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v.sub}</p>
                    <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{v.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Emergency Escalation Tree</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {activeParent.emergencyContacts.map((c, i) => (
                  <div key={i} style={{ padding: 12, background: '#fff', borderRadius: 10, border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({c.relation} • {c.location})</span>
                    </div>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsParentProfileOpen(false)} className="btn-primary">Done</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
