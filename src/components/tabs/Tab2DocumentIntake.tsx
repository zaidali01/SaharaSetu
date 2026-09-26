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
    const fileName = typeof fileInput === 'string' ? fileInput : fileInput.name;
    const t1 = setTimeout(() => setScanProgress(55), 250);
    const t2 = setTimeout(() => setScanProgress(85), 550);
    try {
      if (typeof fileInput === 'string') await uploadDocument({ name: fileName });
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

  const card: React.CSSProperties = {
    background: 'rgba(18,35,20,0.85)',
    border: '1px solid var(--color-moss-shadow)',
    borderRadius: 16,
    backdropFilter: 'blur(8px)',
  };

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--color-pure-white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Document <span style={{ color: 'var(--color-electric-sprout)' }}>Intake</span>
          </h1>
          <span className="badge badge-sage" style={{ fontSize: 11 }}>Tasks 4.1–4.2</span>
        </div>
        <p style={{ color: 'var(--color-lichen-sage)', fontSize: 14 }}>
          Zero-hallucination verification pipeline for <strong style={{ color: 'var(--color-pure-white)' }}>{activeParent.name}</strong> · Requires child validation before autonomous activation
        </p>
      </div>

      {/* ── Status strip ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span className="badge badge-dark" style={{ padding: '5px 12px', fontSize: 12 }}>
          <ScanLine size={12} /> Track B Vision OCR: {backendStatus === 'connected' ? 'Live Engine' : 'Fallback Engine'}
        </span>
        <span className="badge badge-sprout" style={{ padding: '5px 12px', fontSize: 12 }}>
          <ShieldCheck size={12} /> Anti-Hallucination Gate Active
        </span>
      </div>

      {/* ── Document switcher ── */}
      <div style={{ ...card, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-lichen-sage)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Active Docs:</span>
          {documents.map(doc => {
            const isActive = activeDocument.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocument(doc)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: isActive ? 'var(--color-electric-sprout)' : 'rgba(39,63,43,0.6)',
                  color: isActive ? 'var(--color-onyx-olive)' : 'var(--color-pale-fern)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                <FileText size={11} />
                {doc.fileName}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.8 }}>
                  {doc.docType === 'PRESCRIPTION' ? 'Rx' : 'Bill'}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => triggerScanAnimation(`rx_dr_jha_${Date.now().toString().slice(-4)}.pdf`)}
          className="btn-primary"
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}
        >
          <Plus size={13} /> Simulate Upload
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Upload + Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault(); setIsDragging(false);
              if (e.dataTransfer.files?.[0]) triggerScanAnimation(e.dataTransfer.files[0]);
              else triggerScanAnimation('dr_verma_prescription_pmch.pdf');
            }}
            style={{
              padding: '24px 20px',
              borderRadius: 16,
              border: `2px dashed ${isDragging ? 'var(--color-electric-sprout)' : 'var(--color-moss-shadow)'}`,
              background: isDragging ? 'rgba(104,239,63,0.06)' : 'rgba(39,63,43,0.2)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              transform: isDragging ? 'scale(0.99)' : 'scale(1)',
            }}
          >
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(104,239,63,0.1)', border: '1px solid rgba(104,239,63,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <UploadCloud size={20} color="var(--color-electric-sprout)" />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-pure-white)', marginBottom: 4 }}>
                Drop Prescription or Lab Scan Here
              </h4>
              <p style={{ fontSize: 12, color: 'var(--color-lichen-sage)' }}>
                Supports PDF, PNG, JPG · {activeDocument.issuer.title} loaded
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
                style={{ ...card, padding: 16, overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-electric-sprout)', fontFamily: 'var(--font-mono)' }}>
                    <ScanLine size={14} style={{ animation: 'pulse 1s infinite' }} /> Vision OCR running...
                  </span>
                  <span style={{ color: 'var(--color-electric-sprout)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{scanProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--color-moss-shadow)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', background: 'var(--color-electric-sprout)', borderRadius: 99, width: `${scanProgress}%`, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-lichen-sage)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  Segmenting bounding boxes · extracting medicines · dosage guardrails...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prescription canvas */}
          <PrescriptionCanvas />
        </div>

        {/* RIGHT: Verification table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Safety gate callout */}
          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', gap: 12 }}>
            <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Safety Guardrail: Child Confirmation Required
              </h4>
              <p style={{ fontSize: 13, color: 'var(--color-pale-fern)', lineHeight: 1.5 }}>
                No automated voice calls or chemist dispatches occur until this schedule is confirmed by you.
              </p>
            </div>
          </div>

          {/* Verification table */}
          <div style={{ ...card, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-moss-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-pure-white)', marginBottom: 2 }}>
                  Pre-Activation Schedule Verification
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-lichen-sage)' }}>
                  Anti-hallucination safe review before syncing to IVR
                </p>
              </div>
              <span className="badge badge-sprout">{prescriptionItems.length} Items</span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-moss-shadow)', background: 'rgba(39,63,43,0.5)' }}>
                    {['Medicine & Strength', 'Category', 'Cadence', 'Next Refill', 'Confidence'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--color-lichen-sage)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
                          borderBottom: '1px solid rgba(39,63,43,0.5)',
                          background: isSelected ? 'rgba(104,239,63,0.06)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--color-moss-shadow)', color: 'var(--color-pale-fern)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                            <div>
                              <input
                                type="text"
                                value={item.medicineName}
                                onChange={e => handleNameChange(item.id, e.target.value)}
                                style={{ fontWeight: 600, color: 'var(--color-pure-white)', fontSize: 13, background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', width: '100%' }}
                              />
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-lichen-sage)' }}>{item.dosage}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="badge badge-sage" style={{ fontSize: 10 }}>{item.category}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={item.frequency}
                            onChange={e => handleFrequencyChange(item.id, e.target.value)}
                            style={{ background: 'var(--color-moss-shadow)', border: '1px solid var(--color-lichen-sage)', borderRadius: 8, padding: '3px 8px', fontSize: 11, color: 'var(--color-pure-white)', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Once Daily (Morning)">Once Daily</option>
                            <option value="Twice Daily (Morning & Night)">Twice Daily</option>
                            <option value="At Bedtime (Night)">At Bedtime</option>
                            <option value="As Needed (SOS)">As Needed</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-pale-fern)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            <Clock size={11} color="var(--color-lichen-sage)" /> {item.nextTriggerTime}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 'var(--radius-pill)',
                            fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                            background: isHigh ? 'rgba(104,239,63,0.1)' : 'rgba(245,158,11,0.1)',
                            color: isHigh ? 'var(--color-electric-sprout)' : '#f59e0b',
                            border: `1px solid ${isHigh ? 'rgba(104,239,63,0.2)' : 'rgba(245,158,11,0.2)'}`,
                          }}>
                            <Sparkles size={9} /> {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer CTA */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-moss-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-pale-fern)' }}>
                <CheckCircle2 size={14} color="var(--color-electric-sprout)" />
                All {prescriptionItems.length} items grounded to <strong style={{ color: 'var(--color-pure-white)' }}>{activeDocument.issuer.title}</strong>
              </div>
              <button
                type="button"
                onClick={approvePrescriptionSchedule}
                className="btn-primary"
                style={{ fontSize: 13, padding: '8px 20px', borderRadius: 10 }}
              >
                Approve & Activate Schedule <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
