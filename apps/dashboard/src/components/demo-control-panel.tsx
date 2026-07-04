"use client";

import React, { useState } from 'react';
import { useDemo } from '../context/useDemoContext';
import {
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
  Radio, X, Menu, Zap, Wifi
} from 'lucide-react';

export const DemoControlPanel: React.FC = () => {
  const {
    isDemoMode,
    setIsDemoMode,
    currentStep,
    setCurrentStep,
    currentScenario,
    setCurrentScenario,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed
  } = useDemo();

  const [isOpen, setIsOpen] = useState(false);

  const stepDescriptions: Record<number, string> = {
    1: "Connected Silos — Introduce client organizations.",
    2: "FL Training — Run federated epochs in real-time.",
    3: "Benchmarks — Analyze model convergence curves.",
    4: "Attack Simulation — Present threat parameters.",
    5: "Alert Trigger — Local model flags anomaly.",
    6: "AI SOC Analyst — Load structured incident report.",
    7: "Explainability — Trace contributing features.",
    8: "Threat Mapping — Assess MITRE ATT&CK techniques.",
    9: "Compliance — Verify GDPR and cost calculations.",
    10: "Summary — Show zero-leakage privacy aggregates."
  };

  return (
    <>
      {/* ── Hamburger Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-50 flex items-center justify-center w-10 h-10 rounded-full shadow-xl border transition-all duration-200 ${
          isDemoMode
            ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
            : 'bg-[#0d1524] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
        }`}
        title={isOpen ? 'Close Demo Panel' : 'Open Demo Panel'}
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        {/* Green pulse when actively playing */}
        {isDemoMode && isPlaying && !isOpen && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#090d16] rounded-full animate-pulse" />
        )}
      </button>

      {/* ── Slide-up Panel ── */}
      <div
        className={`fixed bottom-[68px] right-5 z-50 w-80 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl transition-all duration-300 origin-bottom-right overflow-hidden ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Radio className={`w-3 h-3 ${isDemoMode ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
              Demo Control Panel
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-600 hover:text-slate-300 transition-colors rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Mode Toggle — BIG and visible ── */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Select Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Live Mode */}
            <button
              onClick={() => { setIsDemoMode(false); setIsPlaying(false); setCurrentStep(1); }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                !isDemoMode
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <Wifi className={`w-4 h-4 ${!isDemoMode ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Live Mode</span>
              <span className="text-[8px] text-slate-500 text-center leading-snug">
                Real Flower &amp; DB data
              </span>
            </button>

            {/* Demo Mode */}
            <button
              onClick={() => { setIsDemoMode(true); setCurrentStep(1); setIsPlaying(false); }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                isDemoMode
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <Zap className={`w-4 h-4 ${isDemoMode ? 'text-indigo-400' : 'text-slate-600'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Demo Mode</span>
              <span className="text-[8px] text-slate-500 text-center leading-snug">
                Simulated scenarios
              </span>
            </button>
          </div>
        </div>

        {/* ── Demo Controls (only visible when Demo Mode is ON) ── */}
        {isDemoMode && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">

            {/* Scenario Selector */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Scenario Target
              </label>
              <select
                value={currentScenario}
                onChange={(e) => {
                  setCurrentScenario(e.target.value);
                  setCurrentStep(1);
                  setIsPlaying(false);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white cursor-pointer focus:outline-none focus:border-indigo-600"
              >
                <option value="ddos">🔴 DDoS Attack Sweep</option>
                <option value="ransomware">🔒 Ransomware Infiltration</option>
                <option value="insider">👤 Insider Lateral Scan</option>
                <option value="botnet">🤖 Botnet Beaconing C2</option>
                <option value="portscan">🔍 Port Scan Discovery</option>
              </select>
            </div>

            {/* Step Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>Guided Tour Steps</span>
                <span className="text-white">Step {currentStep} / 10</span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentStep(idx + 1)}
                    title={`Step ${idx + 1}`}
                    className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all hover:opacity-80 ${
                      idx + 1 <= currentStep
                        ? 'bg-indigo-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Description */}
            <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
              <p className="text-[9px] font-semibold text-slate-300 leading-snug">
                <span className="text-indigo-400 mr-1">Step {currentStep}:</span>
                {stepDescriptions[currentStep]}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              {/* Speed */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold uppercase text-slate-500">Speed</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] text-slate-300 focus:outline-none"
                >
                  <option value={3}>3s</option>
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  onClick={() => { setCurrentStep(1); setIsPlaying(false); }}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentStep(Math.min(10, currentStep + 1))}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Next Step"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live mode info text */}
        {!isDemoMode && (
          <div className="px-4 pb-4">
            <p className="text-[9px] text-slate-500 leading-relaxed text-center">
              Switch to <span className="text-indigo-400 font-bold">Demo Mode</span> above to run guided attack scenarios.
            </p>
          </div>
        )}
      </div>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};
