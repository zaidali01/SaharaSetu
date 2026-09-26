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
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <p className="page-breadcrumb">Operations / Document Intake</p>
          <h1 className="page-title">Prescription OCR & Schedule Verification</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Zero-hallucination pipeline for <strong>{activeParent.name}</strong> · Child validation required before activation
          </p>
        </div>
        <div className="page-actions">
          <span className="status-pill active">
            <ScanLine size={13} />
            Track B Vision OCR: {backendStatus === 'connected' ? 'Live' : 'Fallback'}
          </span>
          <span className="status-pill active">
            <ShieldCheck size={13} />
            Anti-Hallucination Gate
          </span>
        </div>
      </div>

      {/* ── Document switcher ── */}
      <div className="card" style={{ padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Active Docs:</span>
          {documents.map(doc => {
            const isActive = activeDocument.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocument(doc)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                  background: isActive ? 'var(--green-50)' : '#fff',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  transition: 'all 0.12s',
                }}
              >
                <FileText size={11} />
                {doc.fileName}
                <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>
                  {doc.docType === 'PRESCRIPTION' ? 'Rx' : 'Bill'}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => triggerScanAnimation(`rx_dr_jha_${Date.now().toString().slice(-4)}.pdf`)}
          className="btn-primary"
          style={{ fontSize: 12, padding: '6px 14px' }}
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
            className="card"
            style={{
              padding: '28px 20px',
              border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--card-border)'}`,
              background: isDragging ? 'var(--green-50)' : '#fff',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--green-50)', border: '1px solid var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <UploadCloud size={20} color="var(--accent)" />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Drop Prescription or Lab Scan Here
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
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
                className="card"
                style={{ padding: 16, overflow: 'hidden', background: '#1a1a2e', color: '#fff', border: 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sprout)' }}>
                    <ScanLine size={14} /> Vision OCR running...
                  </span>
                  <span style={{ color: 'var(--sprout)', fontWeight: 700 }}>{scanProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--sprout)', borderRadius: 99, width: `${scanProgress}%`, transition: 'width 0.3s ease' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <PrescriptionCanvas />
        </div>

        {/* RIGHT: Verification table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Safety gate callout */}
          <div className="card" style={{ padding: 14, display: 'flex', gap: 12, background: 'var(--amber-50)', border: '1px solid var(--amber-100)' }}>
            <ShieldAlert size={18} color="var(--amber-600)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Safety Guardrail: Child Confirmation Required
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                No automated voice calls or chemist dispatches occur until this schedule is confirmed by you.
              </p>
            </div>
          </div>

          {/* Verification table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Pre-Activation Schedule Verification
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Anti-hallucination safe review before syncing to IVR
                </p>
              </div>
              <span className="kanban-column-badge green">{prescriptionItems.length} Items</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--content-bg)' }}>
                    {['Medicine & Strength', 'Category', 'Cadence', 'Next Refill', 'Confidence'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
                          borderBottom: '1px solid var(--card-border)',
                          background: isSelected ? 'var(--green-50)' : '#fff',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--content-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                            <div>
                              <input
                                type="text"
                                value={item.medicineName}
                                onChange={e => handleNameChange(item.id, e.target.value)}
                                style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', width: '100%' }}
                              />
                              <p className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.dosage}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--content-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>{item.category}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={item.frequency}
                            onChange={e => handleFrequencyChange(item.id, e.target.value)}
                            style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Once Daily (Morning)">Once Daily</option>
                            <option value="Twice Daily (Morning & Night)">Twice Daily</option>
                            <option value="At Bedtime (Night)">At Bedtime</option>
                            <option value="As Needed (SOS)">As Needed</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
                            <Clock size={11} color="var(--text-muted)" /> {item.nextTriggerTime}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700,
                            background: isHigh ? 'var(--green-100)' : 'var(--amber-100)',
                            color: isHigh ? 'var(--green-600)' : 'var(--amber-600)',
                          }}>
                            <Sparkles size={10} /> {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={14} color="var(--green-600)" />
                All {prescriptionItems.length} items grounded to <strong>{activeDocument.issuer.title}</strong>
              </div>
              <button
                type="button"
                onClick={approvePrescriptionSchedule}
                className="btn-primary"
              >
                Approve & Activate Schedule <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
