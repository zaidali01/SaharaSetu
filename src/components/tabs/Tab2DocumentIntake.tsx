import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, ShieldAlert, CheckCircle2, Sparkles, Clock, ArrowRight,
  ShieldCheck, ScanLine, FileText, Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrescriptionCanvas } from '../prescription/PrescriptionCanvas';
import { playSound } from '../../utils/audio';

export const Tab2DocumentIntake: React.FC = () => {
  const {
    prescriptionItems, setPrescriptionItems, approvePrescriptionSchedule,
    selectedRxId, setSelectedRxId, activeParent, documents, activeDocument,
    setActiveDocument, uploadDocument, isOcrProcessing, backendStatus,
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleFrequencyChange = (id: string, newFreq: string) =>
    setPrescriptionItems(prev => prev.map(item => item.id === id ? { ...item, frequency: newFreq } : item));

  const handleNameChange = (id: string, newName: string) =>
    setPrescriptionItems(prev => prev.map(item => item.id === id ? { ...item, medicineName: newName } : item));

  const triggerScanAnimation = async (fileInput: File | string) => {
    setIsScanning(true); setScanProgress(20); playSound('ping');
    const t1 = setTimeout(() => setScanProgress(55), 250);
    const t2 = setTimeout(() => setScanProgress(85), 550);
    try {
      if (typeof fileInput === 'string') await uploadDocument({ name: fileInput });
      else await uploadDocument(fileInput);
      clearTimeout(t1); clearTimeout(t2); setScanProgress(100);
      setTimeout(() => { setIsScanning(false); playSound('approval'); }, 350);
    } catch {
      clearTimeout(t1); clearTimeout(t2); setScanProgress(100);
      setTimeout(() => { setIsScanning(false); }, 350);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) triggerScanAnimation(e.target.files[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header-container">
        <div>
          <p className="page-breadcrumb">Operations / Document Intake</p>
          <h1 className="page-title">Prescription OCR & Verification</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Zero-hallucination pipeline for <strong>{activeParent.name}</strong> · Verification required
          </p>
        </div>
        <div className="page-actions">
          <span className="status-chip active">
            <ScanLine size={13} />
            OCR {backendStatus === 'connected' ? 'Live' : 'Fallback'}
          </span>
          <span className="status-chip">
            <ShieldCheck size={13} />
            Anti-Hallucination Gate
          </span>
        </div>
      </div>

      {/* ── Document switcher ── */}
      <div className="card" style={{ padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Active Docs:</span>
          {documents.map(doc => {
            const isActive = activeDocument.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocument(doc)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--terracotta)' : '1px solid var(--border-light)',
                  background: isActive ? 'var(--soft-accent-tint)' : 'var(--surface-secondary)',
                  color: isActive ? 'var(--terracotta)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all 0.15s'
                }}
              >
                <FileText size={14} />
                {doc.fileName}
                <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>
                  {doc.docType === 'PRESCRIPTION' ? 'Rx' : 'Bill'}
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={() => triggerScanAnimation(`rx_dr_jha_${Date.now().toString().slice(-4)}.pdf`)} className="btn btn-outline" style={{ fontSize: 13 }}>
          <Plus size={14} /> Simulate Upload
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Upload + Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault(); setIsDragging(false);
              if (e.dataTransfer.files?.[0]) triggerScanAnimation(e.dataTransfer.files[0]);
              else triggerScanAnimation('dr_verma_prescription_pmch.pdf');
            }}
            className="card"
            style={{
              padding: '32px 24px',
              border: `1px dashed ${isDragging ? 'var(--terracotta)' : 'var(--border-light)'}`,
              background: isDragging ? 'var(--soft-accent-tint)' : 'var(--surface-secondary)',
              textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <UploadCloud size={24} color="var(--terracotta)" />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)', marginBottom: 4 }}>
                Drop Prescription or Scan
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                PDF, PNG, JPG · {activeDocument.issuer.title}
              </p>
            </label>
          </div>

          {/* Scan progress */}
          <AnimatePresence>
            {(isScanning || isOcrProcessing) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card"
                style={{ padding: 16, overflow: 'hidden', background: 'var(--ink)', color: 'var(--bg-page)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bg-page)' }}>
                    <ScanLine size={14} /> Vision OCR running...
                  </span>
                  <span className="mono" style={{ color: 'var(--terracotta)', fontWeight: 700 }}>{scanProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--terracotta)', width: `${scanProgress}%`, transition: 'width 0.3s ease' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <PrescriptionCanvas />
        </div>

        {/* RIGHT: Verification table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Safety gate callout */}
          <div className="card" style={{ padding: 16, display: 'flex', gap: 12, background: 'var(--review-soft)', borderColor: 'var(--mustard)' }}>
            <ShieldAlert size={20} color="var(--review-text)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--review-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Guardrail: Manual Confirmation Required
              </h4>
              <p style={{ fontSize: 14, color: 'var(--review-text)', opacity: 0.9 }}>
                No automated voice calls or chemist dispatches occur until this schedule is confirmed.
              </p>
            </div>
          </div>

          {/* Verification table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)', marginBottom: 2 }}>
                  Pre-Activation Schedule Verification
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Anti-hallucination safe review before syncing to IVR
                </p>
              </div>
              <span className="badge badge-success">{prescriptionItems.length} Items</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--surface-secondary)' }}>
                    {['Medicine & Strength', 'Category', 'Cadence', 'Next Refill', 'Confidence'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prescriptionItems.map((item, idx) => {
                    const isSelected = selectedRxId === item.id;
                    const isHigh = item.confidence >= 0.95;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRxId(item.id)}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          background: isSelected ? 'var(--success-soft)' : '#fff',
                          cursor: 'pointer', transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--surface-muted)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                            <div>
                              <input
                                type="text"
                                value={item.medicineName}
                                onChange={e => handleNameChange(item.id, e.target.value)}
                                style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-ink)', fontSize: 14, background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                              />
                              <p className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.dosage}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>{item.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={item.frequency}
                            onChange={e => handleFrequencyChange(item.id, e.target.value)}
                            style={{ fontFamily: 'var(--font-body)', background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 13, color: 'var(--text-ink)', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Once Daily (Morning)">Once Daily</option>
                            <option value="Twice Daily (Morning & Night)">Twice Daily</option>
                            <option value="At Bedtime (Night)">At Bedtime</option>
                            <option value="As Needed (SOS)">As Needed</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                            <Clock size={14} /> {item.nextTriggerTime}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span className={`badge ${isHigh ? 'badge-success' : 'badge-review'}`}>
                            <Sparkles size={12} /> {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} color="var(--success)" />
                All {prescriptionItems.length} items grounded to <strong>{activeDocument.issuer.title}</strong>
              </div>
              <button type="button" onClick={approvePrescriptionSchedule} className="btn btn-ink">
                Approve & Activate Schedule <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
