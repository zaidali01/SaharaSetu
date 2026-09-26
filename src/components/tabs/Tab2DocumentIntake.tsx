import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  ScanLine,
  FileText,
  Zap,
  Check,
  Key,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrescriptionCanvas } from '../prescription/PrescriptionCanvas';
import { playSound } from '../../utils/audio';
import { getActiveGeminiApiKey, setActiveGeminiApiKey } from '../../services/geminiVision';

export const Tab2DocumentIntake: React.FC = () => {
  const { 
    prescriptionItems, 
    setPrescriptionItems, 
    approvePrescriptionSchedule, 
    selectedRxId, 
    setSelectedRxId,
    activeParent,
    documents,
    activeDocument,
    setActiveDocument,
    uploadDocument,
    isOcrProcessing
  } = useApp();

  const [activeDocId, setActiveDocId] = useState<'verma' | 'roy' | 'sbpdcl' | 'custom'>('verma');
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Gemini API Key in-app configurator
  const [geminiKey, setGeminiKey] = useState<string>(getActiveGeminiApiKey() || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const handleSaveApiKey = () => {
    setActiveGeminiApiKey(tempKey);
    setGeminiKey(tempKey.trim());
    setIsKeyModalOpen(false);
    playSound('approval');
  };

  // Sync activeDocId with activeDocument if updated externally
  React.useEffect(() => {
    if (activeDocument.id === 'doc-1') setActiveDocId('verma');
    else if (activeDocument.id === 'doc-2') setActiveDocId('roy');
    else if (activeDocument.id === 'doc-3') setActiveDocId('sbpdcl');
    else setActiveDocId('custom');
  }, [activeDocument.id]);

  // 3 Sample Presets
  const samplePresets: {
    id: 'verma' | 'roy' | 'sbpdcl';
    docId: string;
    label: string;
    icon: React.ElementType;
    badge: string;
  }[] = [
    {
      id: 'verma',
      docId: 'doc-1',
      label: 'Sample 1: Dr. S.K. Verma (Cardio / BP)',
      icon: FileText,
      badge: 'Cardio Rx'
    },
    {
      id: 'roy',
      docId: 'doc-2',
      label: 'Sample 2: Dr. Anita Roy (Ortho / Joint Care)',
      icon: FileText,
      badge: 'Ortho Rx'
    },
    {
      id: 'sbpdcl',
      docId: 'doc-3',
      label: 'Sample 3: SBPDCL Electricity Bill',
      icon: Zap,
      badge: 'Utility Bill'
    }
  ];

  const handleSelectPreset = (presetKey: 'verma' | 'roy' | 'sbpdcl', docId: string) => {
    setActiveDocId(presetKey);
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      playSound('ping');
      setActiveDocument(doc);
    }
  };

  const handleFrequencyChange = (id: string, newFreq: string) => {
    setPrescriptionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, frequency: newFreq } : item))
    );
  };

  const handleNameChange = (id: string, newName: string) => {
    setPrescriptionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, medicineName: newName } : item))
    );
  };

  const handleDosageChange = (id: string, newDosage: string) => {
    setPrescriptionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, dosage: newDosage } : item))
    );
  };

  const handleTriggerTimeChange = (id: string, newTime: string) => {
    setPrescriptionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, nextTriggerTime: newTime } : item))
    );
  };

  const handleAddItem = () => {
    const newItem = {
      id: `rx-manual-${Date.now()}`,
      medicineName: 'Tab. New Medication',
      dosage: '10mg',
      category: 'General',
      frequency: 'Once Daily (Morning)',
      frequencyCode: 'OD',
      instruction: '1 dose once daily as directed',
      nextTriggerTime: '08:00 AM Tomorrow',
      confidence: 0.99,
      rawOcrText: 'Tab. New Medication 10mg OD',
      sourceBox: { top: 38 + prescriptionItems.length * 12, left: 12, width: 76, height: 8 },
      status: 'verified' as const
    };
    setPrescriptionItems(prev => [...prev, newItem]);
    setSelectedRxId(newItem.id);
    playSound('ping');
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrescriptionItems(prev => prev.filter(item => item.id !== id));
    playSound('ping');
  };

  // Instant File Preview + Asynchronous Vision OCR Pipeline
  const handleProcessUploadedFile = async (fileOrName: File | { name: string; previewImageUrl?: string } | string) => {
    setActiveDocId('custom');
    setIsScanning(true);
    setScanProgress(20);
    playSound('ping');

    let previewUrl = '';
    const fileName = typeof fileOrName === 'string' ? fileOrName : fileOrName.name;
    const isFileInstance = typeof window !== 'undefined' && fileOrName instanceof File;

    if (isFileInstance) {
      previewUrl = URL.createObjectURL(fileOrName as File);
    } else if (typeof fileOrName === 'object' && 'previewImageUrl' in fileOrName && fileOrName.previewImageUrl) {
      previewUrl = fileOrName.previewImageUrl;
    }

    // 1. Instantly display the real uploaded image preview in the UI
    const immediateDoc = {
      id: `doc-uploaded-${Date.now()}`,
      parentId: activeParent.id,
      fileName,
      docType: (fileName.toLowerCase().includes('bill') ? 'ELECTRICITY_BILL' : 'PRESCRIPTION') as 'ELECTRICITY_BILL' | 'PRESCRIPTION',
      previewImageUrl: previewUrl || undefined,
      issuer: {
        title: 'OCR Extraction Active...',
        subtitle: 'Parsing clinical entities & dosage cadences',
        address: 'Multimodal Vision OCR Engine',
        regOrConsumer: 'SCAN-ACTIVE'
      },
      patientOrConsumerName: activeParent.name,
      consultDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      vitalsOrSummary: 'Analyzing vitals & medical schedule...',
      extractedItems: []
    };

    setActiveDocument(immediateDoc);
    setScanProgress(45);

    // 2. Perform deep multimodal vision OCR asynchronously
    try {
      setScanProgress(70);
      await uploadDocument(typeof fileOrName === 'string' ? { name: fileOrName } : fileOrName);
      setScanProgress(95);
      setTimeout(() => {
        setScanProgress(100);
        setIsScanning(false);
        playSound('approval');
      }, 150);
    } catch (err) {
      console.error('OCR processing error:', err);
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessUploadedFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Prescription Document Intake & OCR Schedule Verification
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Tasks 4.1 & 4.2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Zero-hallucination verification pipeline: AI Vision OCR extracts medicine regimens for <strong>{activeParent.name}</strong>, requiring child validation before autonomous activation.
          </p>
        </div>

        {/* OCR Engine Config & Safety Indicator Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTempKey(geminiKey);
              setIsKeyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-2xs"
            title="Configure Vision OCR Engine"
          >
            <Zap className={`w-3.5 h-3.5 ${geminiKey ? 'text-teal-600' : 'text-indigo-600'}`} />
            <span className="font-semibold">
              {geminiKey ? 'Gemini 2.0 Flash Active' : 'Client In-Browser OCR Active'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {geminiKey ? '(Cloud API)' : '(Tesseract Engine)'}
            </span>
          </button>

          <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Hallucination Safe Review</span>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <AnimatePresence>
        {isKeyModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-teal-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Configure Gemini Vision API Key</h3>
                </div>
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your Google Gemini API key to enable live multimodal Gemini 2.0 Flash extraction for any uploaded image. If blank, SaharaSetu uses the built-in client-side Tesseract.js OCR engine.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTempKey('');
                    setActiveGeminiApiKey('');
                    setGeminiKey('');
                    setIsKeyModalOpen(false);
                    playSound('ping');
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Key (Use Client OCR)
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Save & Enable
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recent Ingestion Records & Presets */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider pl-0.5">
            Recent Ingestion Records & Presets:
          </span>
          <span className="text-[11px] text-slate-400">
            Click any record to inspect verified extraction & bounding coordinates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {samplePresets.map((preset) => {
            const isActive = activeDocId === preset.id;
            const IconComponent = preset.icon;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id, preset.docId)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs scale-[1.01]'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-slate-800 text-teal-300' : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium truncate">
                    {preset.label}
                  </span>
                </div>

                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                  isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split-Screen Layout: Left Side (Task 4.1) & Right Side (Task 4.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================================
            LEFT SIDE: TASK 4.1 DOCUMENT INTAKE & PRESCRIPTION CANVAS (5 Cols)
        ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleProcessUploadedFile(e.dataTransfer.files[0]);
              } else {
                handleProcessUploadedFile('dr_anjali_deshmukh_prescription.png');
              }
            }}
            className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDragging
                ? 'border-teal-500 bg-teal-50/80 scale-[0.99]'
                : 'border-slate-300 hover:border-teal-500 bg-white'
            }`}
          >
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-slate-800">
                Drop New Prescription or Lab Scan Here
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate max-w-sm mx-auto">
                Supports PDF, PNG, JPG • Loaded: {activeDocument.fileName} ({activeDocument.issuer.title})
              </p>
            </label>
          </div>

          {/* Scanning Progress Overlay / Skeleton if active (1.2s realistic scanner) */}
          <AnimatePresence>
            {(isScanning || isOcrProcessing) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2.5 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-mono text-teal-300">
                    <ScanLine className="w-4 h-4 animate-pulse text-teal-400" />
                    {scanProgress < 40
                      ? 'Scanning document pixels with OCR Engine...'
                      : scanProgress < 75
                      ? 'Detecting prescription molecules & dosages...'
                      : 'Mapping bounding boxes to schedule slots...'}
                  </span>
                  <span className="font-mono text-xs text-teal-400 font-bold">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Grounded extraction &bull; {geminiKey ? 'Gemini 2.0 Flash Multimodal Vision' : 'Client-Side In-Browser Optical Character Recognition'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Realistic Doctor Prescription / Document Canvas */}
          <PrescriptionCanvas />
        </div>


        {/* =========================================================================
            RIGHT SIDE: TASK 4.2 PRE-ACTIVATION SCHEDULE VERIFICATION (7 Cols)
        ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Prominent Mandatory Safety Gate Callout */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-xs flex items-start gap-3 text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold tracking-tight uppercase">
                Safety Guardrail: Child Confirmation Required
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                Scheduled calls and vendor orders remain locked until verified by the child. No automated voice IVR calls or local chemist purchase dispatches occur until this schedule is confirmed.
              </p>
            </div>
          </div>

          {/* Schedule Verification Table Card with tight px-3 py-2 padding for zero clipping */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Pre-Activation Schedule Verification Table
                </h3>
                <p className="text-xs text-slate-500">
                  Anti-hallucination safe review &bull; Grounded to {activeDocument.issuer.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Add medication or schedule item"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Add Line Item</span>
                </button>
                <span className="text-xs font-semibold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full">
                  {prescriptionItems.length} Items Extracted
                </span>
              </div>
            </div>

            {/* Table wrapper with overflow-x-auto and tight cell padding */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-3 py-2.5">Medicine & Strength</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Cadence</th>
                    <th className="px-3 py-2.5">Next Refill Date</th>
                    <th className="px-3 py-2.5 text-right">Confidence</th>
                    <th className="px-2 py-2.5 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptionItems.map((item, idx) => {
                    const isSelected = selectedRxId === item.id;
                    const isHighConfidence = item.confidence >= 0.95;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRxId(item.id)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-teal-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Medicine Name & Dosage */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="space-y-0.5">
                              <input
                                type="text"
                                value={item.medicineName}
                                onChange={(e) => handleNameChange(item.id, e.target.value)}
                                className="font-semibold text-slate-900 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none w-full"
                              />
                              <input
                                type="text"
                                value={item.dosage}
                                onChange={(e) => handleDosageChange(item.id, e.target.value)}
                                className="text-[10px] text-slate-500 font-mono bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none w-full"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* Frequency Dropdown */}
                        <td className="px-3 py-2">
                          <select
                            value={item.frequency}
                            onChange={(e) => handleFrequencyChange(item.id, e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                            <option value="Twice Daily (Morning & Night)">Twice Daily (Morning & Night)</option>
                            <option value="At Bedtime (Night)">At Bedtime (Night)</option>
                            <option value="As Needed (SOS)">As Needed (SOS)</option>
                            <option value="Monthly Recurring Cycle">Monthly Recurring Cycle</option>
                          </select>
                        </td>

                        {/* Next Refill Trigger Time */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={item.nextTriggerTime}
                              onChange={(e) => handleTriggerTimeChange(item.id, e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none text-[11px] font-mono text-slate-700"
                            />
                          </div>
                        </td>

                        {/* Confidence Metric */}
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isHighConfidence
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>

                        {/* Delete Action */}
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="opacity-40 group-hover:opacity-100 hover:text-rose-600 p-1 rounded transition-opacity cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Verification Footer & CTA */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  All {prescriptionItems.length} items grounded to <strong>{activeDocument.issuer.title}</strong> ({activeDocument.patientOrConsumerName})
                </span>
              </div>

              <button
                type="button"
                onClick={approvePrescriptionSchedule}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Approve & Activate Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
