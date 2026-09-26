import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, ShieldAlert, CheckCircle2, Sparkles, Clock, ArrowRight,
  ShieldCheck, ScanLine, FileText, Plus, Trash2, GitCompareArrows, PenLine, Undo2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrescriptionCanvas } from '../prescription/PrescriptionCanvas';
import { playSound } from '../../utils/audio';
import { buildFieldDiff, isDosageCorrection, type ExtractedSnapshot } from '../../utils/extractionDiff';
import { CLINICAL_GATE_THRESHOLD } from '../../services/api';

export const Tab2DocumentIntake: React.FC = () => {
  const {
    prescriptionItems, setPrescriptionItems, approvePrescriptionSchedule,
    selectedRxId, setSelectedRxId, activeParent, documents, activeDocument,
    setActiveDocument, uploadDocument, isOcrProcessing, backendStatus,
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showDiff, setShowDiff] = useState(true);
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);

  const handleFrequencyChange = (id: string, newFreq: string) =>
    setPrescriptionItems(prev => prev.map(item => item.id === id ? { ...item, frequency: newFreq } : item));

  // Task 3.5t: the OCR engine no longer invents a confidence score, so genuinely
  // unscored lines now surface here instead of hiding behind a default 0.95.
  const needsReviewCount = prescriptionItems.filter(i => i.confidence < CLINICAL_GATE_THRESHOLD).length;

  const handleNameChange = (id: string, newName: string) =>
    setPrescriptionItems(prev => prev.map(item => item.id === id ? { ...item, medicineName: newName } : item));

  // Task 2.5: restore the machine reading for a single field without discarding
  // the child's other corrections.
  const revertField = (id: string, field: keyof ExtractedSnapshot) =>
    setPrescriptionItems(prev => prev.map(item => {
      if (item.id !== id || !item.extracted) return item;
      return { ...item, [field]: item.extracted[field] } as typeof item;
    }));

  const revertAll = () => {
    setPrescriptionItems(prev => prev.map(item => item.extracted
      ? { ...item, ...item.extracted } as typeof item
      : item
    ));
    setExpandedDiffId(null);
    playSound('ping');
  };

  const diffsById = prescriptionItems.reduce<Record<string, ReturnType<typeof buildFieldDiff>>>((acc, item) => {
    acc[item.id] = buildFieldDiff(item.extracted, item as unknown as ExtractedSnapshot);
    return acc;
  }, {});

  const totalCorrections = Object.values(diffsById).reduce((sum, d) => sum + d.length, 0);
  const dosageCorrections = Object.values(diffsById).filter(isDosageCorrection).length;

  const handleAddItem = () => {
    const newItem = {
      id: `rx-manual-${Date.now()}`,
      medicineName: 'Tab. Paracetamol',
      dosage: '500 mg',
      frequency: 'As Needed (SOS)',
      frequencyCode: 'SOS',
      instruction: 'Take 1 tablet in case of acute pain or fever',
      nextTriggerTime: 'On-Demand (SOS Trigger)',
      confidence: 1.0,
      sourceBox: { top: 72, left: 12, width: 76, height: 7 },
      status: 'verified' as const,
      category: 'General',
      rawOcrText: 'Tab. Paracetamol 500mg SOS (Manual Addition)'
    };
    setPrescriptionItems(prev => [...prev, newItem]);
    setSelectedRxId(newItem.id);
    playSound('ping');
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrescriptionItems(prev => prev.filter(item => item.id !== id));
    if (selectedRxId === id) {
      const remaining = prescriptionItems.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedRxId(remaining[0].id);
    }
  };

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

      {/* ── Document switcher & Presets ── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', maxWidth: '100%' }}>
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

        {/* Quick Grounded Testing Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Presets:</span>
          <button
            type="button"
            onClick={() => triggerScanAnimation('dr_verma_prescription_pmch.pdf')}
            className="btn btn-outline"
            style={{ fontSize: 11, padding: '5px 8px' }}
            title="Dr. S. K. Verma (Patna Cardiology)"
          >
            🩺 Dr. Verma
          </button>
          <button
            type="button"
            onClick={() => triggerScanAnimation('dr_roy_orthopedic_patna.pdf')}
            className="btn btn-outline"
            style={{ fontSize: 11, padding: '5px 8px' }}
            title="Dr. Anita Roy (Patna Orthopedic)"
          >
            🦴 Dr. Roy
          </button>
          <button
            type="button"
            onClick={() => triggerScanAnimation('sbpdcl_patna_electric_bill.pdf')}
            className="btn btn-outline"
            style={{ fontSize: 11, padding: '5px 8px' }}
            title="SBPDCL Patna Electricity Bill"
          >
            ⚡ SBPDCL
          </button>
          <button
            type="button"
            onClick={() => triggerScanAnimation('dr_sinha_patna_thyroid.pdf')}
            className="btn btn-outline"
            style={{ fontSize: 11, padding: '5px 8px' }}
            title="Dr. Manisha Sinha (Endocrinology)"
          >
            💊 Dr. Sinha
          </button>
          <button
            type="button"
            onClick={() => triggerScanAnimation('epfo_life_certificate_notice.pdf')}
            className="btn btn-outline"
            style={{ fontSize: 11, padding: '5px 8px' }}
            title="EPFO Pension Life Certificate Intimation"
          >
            🧓 EPFO Pension
          </button>
          <button
            type="button"
            onClick={() => triggerScanAnimation(`rx_dr_jha_${Date.now().toString().slice(-4)}.pdf`)}
            className="btn btn-outline"
            style={{ fontSize: 11, padding: '5px 10px', background: 'var(--surface-secondary)' }}
          >
            <Plus size={13} /> Simulate
          </button>
        </div>
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

          {/* Dynamic low-confidence banner (Task 3.5t) */}
          <AnimatePresence>
            {needsReviewCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="card"
                style={{ padding: 14, display: 'flex', gap: 12, background: 'var(--surface-muted)', borderColor: 'var(--terracotta)' }}
              >
                <ShieldAlert size={18} color="var(--terracotta)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {needsReviewCount} line{needsReviewCount > 1 ? 's' : ''} below the {CLINICAL_GATE_THRESHOLD.toFixed(2)} clinical gate
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    The scanner could not read {needsReviewCount > 1 ? 'these lines' : 'this line'} confidently.
                    We recorded 0% rather than guessing — check {needsReviewCount > 1 ? 'them' : 'it'} against the
                    paper prescription before confirming.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)', marginBottom: 2 }}>
                  Pre-Activation Schedule Verification
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Anti-hallucination safe review before syncing to IVR
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowDiff(v => !v)}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                  title="Toggle the extracted vs. corrected comparison"
                >
                  <GitCompareArrows size={13} /> {showDiff ? 'Hide' : 'Show'} Diff
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Plus size={13} /> Add Item
                </button>
                <span className="badge badge-success">{prescriptionItems.length} Items</span>
              </div>
            </div>

            {/* Correction summary — Task 2.5 */}
            <AnimatePresence>
              {showDiff && totalCorrections > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '12px 20px',
                    background: dosageCorrections > 0 ? 'var(--review-soft)' : 'var(--soft-accent-tint)',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 10,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-ink)' }}>
                    <PenLine size={15} color="var(--terracotta)" />
                    <span>
                      <strong>{totalCorrections}</strong> field correction{totalCorrections === 1 ? '' : 's'} by you against the OCR reading
                      {dosageCorrections > 0 && (
                        <> · <strong style={{ color: 'var(--review-text)' }}>{dosageCorrections}</strong> touch dosage strength</>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={revertAll}
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Undo2 size={12} /> Revert all to OCR
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--surface-secondary)' }}>
                    {['Medicine & Strength', 'Category', 'Cadence', 'Trigger Slot', 'Confidence', 'Extraction Diff', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: h === 'Action' ? 'center' : 'left', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prescriptionItems.map((item, idx) => {
                    const isSelected = selectedRxId === item.id;
                    const isHigh = item.confidence >= 0.95;
                    const isLowConfidence = item.confidence < 0.6;
                    const diffs = diffsById[item.id] ?? [];
                    const isDiffOpen = expandedDiffId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setSelectedRxId(item.id)}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          background: isSelected ? 'var(--success-soft)' : '#fff',
                          cursor: 'pointer', transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
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
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>{item.category}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            value={item.frequency}
                            onChange={e => handleFrequencyChange(item.id, e.target.value)}
                            style={{ fontFamily: 'var(--font-body)', background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 13, color: 'var(--text-ink)', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                            <option value="Once Daily (Evening)">Once Daily (Evening)</option>
                            <option value="Twice Daily (Morning & Night)">Twice Daily</option>
                            <option value="At Bedtime (Night)">At Bedtime</option>
                            <option value="Once Weekly">Once Weekly</option>
                            <option value="As Needed (SOS)">As Needed</option>
                            <option value="Monthly Recurring Cycle">Monthly</option>
                            <option value="One-Off Deadline">One-Off Deadline</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                            <Clock size={14} /> {item.nextTriggerTime}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            className={`badge ${isLowConfidence ? 'badge-review' : isHigh ? 'badge-success' : 'badge-review'}`}
                            title={isLowConfidence ? 'Below the 0.60 clinical gate — mandatory child review' : 'OCR confidence for this line'}
                          >
                            <Sparkles size={12} /> {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {showDiff && (diffs.length > 0 || !item.extracted) ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setExpandedDiffId(isDiffOpen ? null : item.id); }}
                              className={`badge ${diffs.length > 0 ? (isDosageCorrection(diffs) ? 'badge-review' : 'badge-success') : 'badge-review'}`}
                              style={{ cursor: 'pointer', border: 'none' }}
                              title={item.extracted ? 'Compare OCR reading with your corrections' : 'Added manually — not machine extracted'}
                            >
                              {item.extracted ? <GitCompareArrows size={12} /> : <PenLine size={12} />}
                              {item.extracted ? (diffs.length > 0 ? `${diffs.length} edited` : 'No edits') : 'Manual'}
                            </button>
                          ) : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveItem(item.id, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 4,
                              borderRadius: 'var(--radius-sm)',
                              transition: 'color 0.15s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>

                      {/* Task 2.5: extracted vs. child-corrected diff */}
                      <AnimatePresence>
                        {showDiff && isDiffOpen && (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ background: 'var(--surface-secondary)' }}
                          >
                            <td colSpan={7} style={{ padding: '0 14px 14px 14px' }}>
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{
                                  border: '1px solid var(--border-light)',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#fff',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    padding: '8px 12px',
                                    background: 'var(--surface-muted)',
                                    fontSize: 10,
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    display: 'flex', alignItems: 'center', gap: 6
                                  }}>
                                    <GitCompareArrows size={12} />
                                    Extracted vs. Confirmed
                                    <span className="mono" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0 }}>
                                      source: "{item.rawOcrText}"
                                    </span>
                                  </div>

                                  {!item.extracted ? (
                                    <p style={{ padding: '12px', fontSize: 13, color: 'var(--text-muted)' }}>
                                      Added manually by you — this row was not produced by the OCR engine, so there is nothing to compare.
                                    </p>
                                  ) : diffs.length === 0 ? (
                                    <p style={{ padding: '12px', fontSize: 13, color: 'var(--text-muted)' }}>
                                      No corrections — every field matches the OCR reading exactly.
                                    </p>
                                  ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                          {['Field', 'OCR Extracted', 'Child Confirmed', ''].map(h => (
                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {diffs.map(d => (
                                          <tr key={d.field} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-ink)' }}>
                                              {d.label}
                                              {d.field === 'dosage' && (
                                                <span className="badge badge-review" style={{ marginLeft: 6, fontSize: 9 }}>Dosage</span>
                                              )}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                              {d.extractedValue || '—'}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-ink)', fontWeight: 600 }}>
                                              {d.currentValue || '—'}
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); revertField(item.id, d.field); }}
                                                className="btn btn-outline"
                                                style={{ fontSize: 10, padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                title={`Restore the OCR value for ${d.label}`}
                                              >
                                                <Undo2 size={10} /> Revert
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}

                                  {diffs.length > 0 && isDosageCorrection(diffs) && (
                                    <p style={{ padding: '10px 12px', fontSize: 12, color: 'var(--review-text)', background: 'var(--review-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <ShieldAlert size={13} />
                                      A strength was overridden by you. The agent never alters dosages — this correction is logged to the audit ledger under your name.
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: 'var(--surface-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} color="var(--success)" />
                All {prescriptionItems.length} items grounded to <strong>{activeDocument.issuer.title}</strong>
                {totalCorrections > 0 && (
                  <span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>
                    · {totalCorrections} correction{totalCorrections === 1 ? '' : 's'} recorded
                  </span>
                )}
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
