import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  Languages, 
  Sparkles, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  Headphones, 
  RotateCcw, 
  Activity,
  AlertTriangle,
  ShoppingBag,
  AlertOctagon,
  Check,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playSound } from '../../utils/audio';

type CallOutcomeScenario = 'taken' | 'missed' | 'refill' | 'distress';

export const TranscriptModal: React.FC = () => {
  const { 
    activeTranscriptTask, 
    setActiveTranscriptTask, 
    activeParent, 
    addEventLog, 
    addToast,
    setActiveWhatsAppTask,
    triggerSimulateDistressAlert
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [selectedScenario, setSelectedScenario] = useState<CallOutcomeScenario>('taken');

  const isMother = activeParent?.relation?.toLowerCase().includes('mother');
  const parentLanguage = activeParent?.preferredLanguage || 'Hindi / Bhojpuri';

  // Dynamic Multi-Outcome Scenarios based on Elder's real response ("दवाई खाई या नहीं")
  const scenarios: Record<CallOutcomeScenario, {
    label: string;
    icon: React.ElementType;
    badgeText: string;
    sentiment: 'Positive' | 'Normal' | 'Uncertain' | 'Distress';
    duration: string;
    audioSeconds: number;
    originalText: string;
    translatedText: string;
    keywords: string[];
    actionLabel: string;
    themeColor: string;
  }> = {
    taken: {
      label: 'Dose Taken (हाँ, खा ली)',
      icon: CheckCircle2,
      badgeText: 'Dose Confirmed · 8:15 AM',
      sentiment: 'Positive',
      duration: '0:34',
      audioSeconds: 34,
      originalText: isMother
        ? 'हाँ बाबू, खाली पेटे थायरॉइड के गोली खा लेले बानी।'
        : 'हाँ बाबू, नाश्ते के बाद बीपी वाला गोली खा लीहली। सब ठीक बा।',
      translatedText: isMother
        ? 'Yes son, I have taken the thyroid tablet on an empty stomach.'
        : 'Yes son, I took the BP medicine right after breakfast. Everything is good.',
      keywords: ['नाश्ता (Breakfast)', 'दवाई खा लीहली (Took medicine)', 'सब ठीक बा (All fine)'],
      actionLabel: 'Mark Confirmed in Care Record',
      themeColor: 'emerald'
    },
    missed: {
      label: 'Dose Missed (नहीं खाई / भूल गए)',
      icon: AlertTriangle,
      badgeText: 'Dose Missed · 30m Re-call Active',
      sentiment: 'Uncertain',
      duration: '0:41',
      audioSeconds: 41,
      originalText: isMother
        ? 'नाहीं बाबू, आज सुबह पूजा में लग गइनी त ध्यान से उतर गईल, अभी नइखी खईले।'
        : 'नाहीं बेटा, अभी चाय पी रहे हैं, दवाई लेना भूल गए थे। अभी थोड़ी देर में लेंगे।',
      translatedText: isMother
        ? 'No son, got busy with morning prayers and it slipped my mind, haven\'t taken it yet.'
        : 'No son, having morning tea right now, forgot to take it. Will take in a bit.',
      keywords: ['भूल गए (Forgot)', 'अभी नइखी खईले (Not taken yet)', 'थोड़ी देर में (In a while)'],
      actionLabel: 'Trigger 30-Min Re-call & Reminder SMS',
      themeColor: 'amber'
    },
    refill: {
      label: 'Stock Finished (दवाई ख़त्म हो गई)',
      icon: ShoppingBag,
      badgeText: 'Stock-Out · Refill Needed',
      sentiment: 'Normal',
      duration: '0:48',
      audioSeconds: 48,
      originalText: isMother
        ? 'बाबू, ई थायरॉइड के डब्बा में गोली ख़त्म हो गईल बा, कल से नया मँगावे के पड़ी।'
        : 'बेटा, स्ट्रिप में सिर्फ एक ही गोली बची थी जो खा ली। अब खत्म हो गया है, मुकेश मेडिकल से मंगा दो।',
      translatedText: isMother
        ? 'Son, the tablets in this thyroid bottle are finished, need to order a new pack from tomorrow.'
        : 'Son, only one pill was left in the strip which I took. It is finished now, please order from Mukesh Medical Store.',
      keywords: ['ख़त्म हो गईल बा (Finished)', 'नया मँगावे के पड़ी (Need to order new)', 'मुकेश मेडिकल (Mukesh Store)'],
      actionLabel: 'Open Chemist WhatsApp Order Draft',
      themeColor: 'blue'
    },
    distress: {
      label: 'Distress / Unwell (तबियत खराब है)',
      icon: AlertOctagon,
      badgeText: '🚨 Distress Keyword Detected',
      sentiment: 'Distress',
      duration: '0:52',
      audioSeconds: 52,
      originalText: isMother
        ? 'आज सुबह से तनी चक्कर जइसन बुझाता बाबू, बाकिर अभी बैठल बानी... सर भारी बा।'
        : 'बेटा आज चक्कर आ रहा है और छाती में घबराहट महसूस हो रही है... दवाई नहीं ली अभी।',
      translatedText: isMother
        ? 'Feeling a bit dizzy since morning son, sitting down right now... head is heavy.'
        : 'Son, feeling dizzy today and restlessness in chest... haven\'t taken medication yet.',
      keywords: ['चक्कर (Dizziness)', 'घबराहट (Restlessness)', 'सर भारी (Heavy head)'],
      actionLabel: 'Trigger Emergency SOS Alert to Family',
      themeColor: 'rose'
    }
  };

  const activeScenarioData = scenarios[selectedScenario];

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2 * selectedSpeed;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedSpeed]);

  if (!activeTranscriptTask) return null;

  const handleScenarioChange = (scenario: CallOutcomeScenario) => {
    setSelectedScenario(scenario);
    setPlaybackProgress(0);
    setIsPlaying(false);
    playSound(scenario === 'distress' ? 'emergency' : scenario === 'missed' ? 'alert' : 'ping');
  };

  const handleExecuteScenarioAction = () => {
    if (selectedScenario === 'taken') {
      playSound('approval');
      addToast({
        type: 'success',
        title: 'Medication Confirmed',
        message: `${activeParent.name}'s dose confirmed via ${parentLanguage.split('/')[0]} STT log.`
      });
      setActiveTranscriptTask(null);
    } else if (selectedScenario === 'missed') {
      playSound('alert');
      addEventLog({
        agentSource: 'Sarvam Caller Agent',
        eventType: 'DOSE_MISSED_RETRY_SCHEDULED',
        severity: 'warning',
        details: `${activeParent.name} reported dose not taken yet ("भूल गए"). Scheduled auto re-call at 08:45 AM.`,
        payload: {
          parent: activeParent.name,
          status: 'DOSE_PENDING',
          retryInMinutes: 30
        }
      });
      addToast({
        type: 'warning',
        title: 'Reminder & Re-call Scheduled',
        message: `30-minute IVR retry queued for ${activeParent.name}. SMS reminder sent.`
      });
      setActiveTranscriptTask(null);
    } else if (selectedScenario === 'refill') {
      playSound('ping');
      setActiveTranscriptTask(null);
      if (activeTranscriptTask.whatsappDraft) {
        setActiveWhatsAppTask(activeTranscriptTask);
      } else {
        addToast({
          type: 'info',
          title: 'Chemist Order Created',
          message: `Refill order generated for ${activeParent.vendors.chemist.name}. Check Needs Approval column.`
        });
      }
    } else if (selectedScenario === 'distress') {
      setActiveTranscriptTask(null);
      triggerSimulateDistressAlert();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">Voice Call Verification Log</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                    Sarvam AI STT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Call ID: {activeTranscriptTask.transcript?.callId || `SARVAM-CALL-${activeParent.id}`} • Today
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveTranscriptTask(null);
              }}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Dynamic Interactive Call Outcome Selector */}
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Simulate Elder Response ("दवाई खाई या नहीं"):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Multi-Path State Machine
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(Object.keys(scenarios) as CallOutcomeScenario[]).map((key) => {
                  const s = scenarios[key];
                  const Icon = s.icon;
                  const isSelected = selectedScenario === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleScenarioChange(key)}
                      className={`px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? key === 'taken'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-semibold'
                            : key === 'missed'
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs font-semibold'
                            : key === 'refill'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-semibold'
                            : 'bg-rose-600 text-white border-rose-700 shadow-xs font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-[10px] leading-tight truncate">
                        {key === 'taken' ? 'हाँ, खा ली' : key === 'missed' ? 'नहीं खाई' : key === 'refill' ? 'ख़त्म हो गई' : 'तबियत खराब'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Call Telemetry Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Caller</span>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-teal-600" />
                  Voice Agent
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Receiver</span>
                <p className="text-xs font-semibold text-slate-800 truncate" title={activeParent.name}>
                  {activeParent.name.split(' ')[0]} ({activeParent.city.split(',')[0]})
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Duration</span>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  {activeScenarioData.duration} min
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Detected State</span>
                <p className={`text-xs font-semibold flex items-center gap-1 ${
                  activeScenarioData.sentiment === 'Distress'
                    ? 'text-rose-600 font-bold'
                    : activeScenarioData.sentiment === 'Uncertain'
                    ? 'text-amber-600 font-bold'
                    : 'text-emerald-700'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {activeScenarioData.sentiment}
                </p>
              </div>
            </div>

            {/* Audio Waveform Simulator Player */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-teal-400" />
                  <span className="font-mono text-[11px]">Sarvam Saarathi-v2 Audio Stream</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const speeds = [1.0, 1.25, 1.5];
                      const nextIndex = (speeds.indexOf(selectedSpeed) + 1) % speeds.length;
                      setSelectedSpeed(speeds[nextIndex]);
                    }}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                  >
                    {selectedSpeed}x
                  </button>
                  <span className="font-mono text-[10px] text-teal-400">
                    {Math.floor((activeScenarioData.audioSeconds * (playbackProgress / 100)) / 60)}:
                    {String(Math.floor((activeScenarioData.audioSeconds * (playbackProgress / 100)) % 60)).padStart(2, '0')} / {activeScenarioData.duration}
                  </span>
                </div>
              </div>

              {/* Animated Waveform Bars */}
              <div className="flex items-center gap-1 h-9 py-1 px-2 bg-slate-950/70 rounded-lg overflow-hidden">
                {Array.from({ length: 32 }).map((_, i) => {
                  const barProgress = (i / 32) * 100;
                  const isPassed = playbackProgress >= barProgress;
                  const baseHeights = [25, 40, 65, 85, 45, 95, 80, 50, 70, 90, 100, 45, 30, 75, 90, 65, 45, 80, 95, 60, 70, 85, 45, 95, 75, 35, 65, 80, 55, 90, 65, 35];
                  const heightPercent = isPlaying 
                    ? Math.min(100, Math.max(15, (baseHeights[i] + (i % 3) * 8))) 
                    : baseHeights[i];

                  return (
                    <motion.div
                      key={i}
                      animate={isPlaying && isPassed ? { scaleY: [0.6, 1.2, 0.7] } : { scaleY: 1 }}
                      transition={{ repeat: Infinity, duration: 0.35 + (i % 4) * 0.1 }}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPassed
                          ? selectedScenario === 'distress'
                            ? 'bg-gradient-to-t from-rose-500 to-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]'
                            : selectedScenario === 'missed'
                            ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                            : 'bg-gradient-to-t from-teal-500 to-emerald-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]'
                          : 'bg-slate-700'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  );
                })}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPlaybackProgress(0)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart</span>
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                    selectedScenario === 'distress'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white'
                      : selectedScenario === 'missed'
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : 'bg-teal-400 hover:bg-teal-300 text-slate-950'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Call Recording
                    </>
                  )}
                </button>

                <span className={`text-[11px] flex items-center gap-1 ${
                  selectedScenario === 'distress' ? 'text-rose-400' : selectedScenario === 'missed' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  <Activity className="w-3 h-3 animate-pulse" />
                  {selectedScenario === 'distress' ? 'Distress Flag' : selectedScenario === 'missed' ? 'Retry Queued' : 'Voice Verified'}
                </span>
              </div>
            </div>

            {/* Dual Language Transcript Cards with Extracted Intent Badge */}
            <div className="space-y-2.5">
              {/* Native Bhojpuri / Hindi */}
              <div className={`border rounded-xl p-3.5 space-y-1.5 ${
                selectedScenario === 'distress'
                  ? 'border-rose-200 bg-rose-50/60'
                  : selectedScenario === 'missed'
                  ? 'border-amber-200 bg-amber-50/60'
                  : 'border-emerald-200 bg-emerald-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    selectedScenario === 'distress' ? 'text-rose-900' : selectedScenario === 'missed' ? 'text-amber-900' : 'text-emerald-900'
                  }`}>
                    <Languages className="w-3.5 h-3.5" />
                    Spoken Indic Audio ({parentLanguage.split('/')[0].trim()} STT via Sarvam AI)
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    Sarvam Saarathi-v2
                  </span>
                </div>
                <p className="text-slate-900 text-sm font-semibold bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  "{activeScenarioData.originalText}"
                </p>
              </div>

              {/* English Translation */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    English Translation & Intent Extraction
                  </span>
                  {/* Extracted Intent Badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    selectedScenario === 'distress'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : selectedScenario === 'missed'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : selectedScenario === 'refill'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {activeScenarioData.badgeText}
                  </span>
                </div>
                <p className="text-slate-800 text-sm italic bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  "{activeScenarioData.translatedText}"
                </p>
              </div>
            </div>

            {/* Detected Keywords */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Extracted Clinical & Routine Entities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeScenarioData.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer & Dynamic Action CTA */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Guardrails active: Zero hallucination policy enforced.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveTranscriptTask(null);
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>

              <button
                onClick={handleExecuteScenarioAction}
                className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 ${
                  selectedScenario === 'distress'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : selectedScenario === 'missed'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : selectedScenario === 'refill'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {selectedScenario === 'distress' ? (
                  <AlertOctagon className="w-3.5 h-3.5" />
                ) : selectedScenario === 'refill' ? (
                  <Send className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>{activeScenarioData.actionLabel}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
