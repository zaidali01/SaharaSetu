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
  Activity 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TranscriptModal: React.FC = () => {
  const { activeTranscriptTask, setActiveTranscriptTask } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);

  const transcript = activeTranscriptTask?.transcript;

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

  if (!activeTranscriptTask || !transcript) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
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
                  Call ID: {transcript.callId} • {transcript.timestamp}
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

          <div className="p-6 overflow-y-auto space-y-5 text-xs">
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
                <p className="text-xs font-semibold text-slate-800 truncate" title={transcript.receiver}>
                  {transcript.receiver.split(' ')[0]} (Patna)
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Duration</span>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  {transcript.duration} min
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Confidence</span>
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {(transcript.confidence * 100).toFixed(0)}% High
                </p>
              </div>
            </div>

            {/* Audio Waveform Simulator Player */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
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
                    {Math.floor((transcript.audioSimulatedTime * (playbackProgress / 100)) / 60)}:
                    {String(Math.floor((transcript.audioSimulatedTime * (playbackProgress / 100)) % 60)).padStart(2, '0')} / 0:{transcript.audioSimulatedTime}
                  </span>
                </div>
              </div>

              {/* Animated Waveform Bars */}
              <div className="flex items-center gap-1 h-10 py-1 px-2 bg-slate-950/70 rounded-lg overflow-hidden">
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
                          ? 'bg-gradient-to-t from-teal-500 to-emerald-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]'
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
                  className="px-4 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-slate-950" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" /> Play Recording
                    </>
                  )}
                </button>

                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Voice Verified
                </span>
              </div>
            </div>

            {/* Dual Language Transcript Cards with Extracted Intent Badge */}
            <div className="space-y-3">
              {/* Native Bhojpuri / Hindi */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                    <Languages className="w-3.5 h-3.5 text-emerald-700" />
                    Spoken Indic Audio (Bhojpuri / Hindi STT via Sarvam AI)
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Sarvam Saarathi-v2
                  </span>
                </div>
                <p className="text-slate-900 text-sm font-semibold bg-white p-3 rounded-lg border border-emerald-200/80">
                  "{transcript.originalText}"
                </p>
              </div>

              {/* English Translation */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    English Translation
                  </span>
                  {/* Extracted Intent Badge */}
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Dose Confirmed · 8:15 AM
                  </span>
                </div>
                <p className="text-slate-800 text-sm italic bg-white p-3 rounded-lg border border-slate-200">
                  "{transcript.translatedText}"
                </p>
              </div>
            </div>

            {/* Detected Keywords */}
            {transcript.keywordsDetected && transcript.keywordsDetected.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Extracted Clinical & Routine Entities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {transcript.keywordsDetected.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Guardrails passed: No medication variation detected.
            </span>
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveTranscriptTask(null);
              }}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
