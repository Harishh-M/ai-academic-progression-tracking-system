import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  Database,
  BookOpen,
  TrendingUp,
  Brain,
  CheckCircle2,
  Activity,
  Layers,
  Radio,
  ShieldCheck,
} from 'lucide-react';

interface AIGeneratingAnimationProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const AI_PIPELINE_STEPS = [
  {
    phase: 1,
    title: 'Ingesting Verified Academic Data',
    detail: 'Retrieving semester SGPA, continuous internal test scores, and attendance records from MySQL ERP...',
    icon: Database,
    color: 'text-sky-500',
    progress: 24,
  },
  {
    phase: 2,
    title: 'Grounding with University Regulations',
    detail: 'Cross-referencing statutory minimums (Anna Univ Regulation Clause 4.2 attendance & 6.0 CGPA threshold)...',
    icon: BookOpen,
    color: 'text-indigo-500',
    progress: 52,
  },
  {
    phase: 3,
    title: 'Neural Trajectory & Risk Diagnostics',
    detail: 'Synthesizing historical learning velocity, subject weak points, and remedial pass probability with Gemini Pro...',
    icon: Brain,
    color: 'text-purple-500',
    progress: 78,
  },
  {
    phase: 4,
    title: 'Generating Actionable Academic Plan',
    detail: 'Compiling structured recommendations, study remedies, and faculty advisory citations...',
    icon: Sparkles,
    color: 'text-amber-500',
    progress: 94,
  },
];

export const AIGeneratingAnimation: React.FC<AIGeneratingAnimationProps> = ({
  title = 'Gemini Academic Intelligence is analyzing performance...',
  subtitle = 'Neural appraisal powered by Google Gemini Pro with Institutional Regulatory Grounding',
  compact = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < AI_PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  const activeStep = AI_PIPELINE_STEPS[currentStepIndex];

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-lg border border-indigo-500/30 animate-ai-pulse-glow">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent animate-ai-shimmer" />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md animate-ai-float">
              <Sparkles className="w-6 h-6 animate-spin text-amber-300" style={{ animationDuration: '6s' }} />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-amber-400" />
                AI Inference Active
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Phase {activeStep.phase}/4</span>
            </div>
            <div className="text-sm font-extrabold text-white truncate mt-0.5">{activeStep.title}</div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">{activeStep.detail}</p>
          </div>
        </div>

        {/* Micro progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 h-1 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${activeStep.progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white p-8 md:p-12 shadow-2xl border border-indigo-500/30 animate-ai-pulse-glow">
      {/* Background animated scanner beam */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-2/3 h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-ai-shimmer" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-7">
        {/* Holographic AI Centerpiece */}
        <div className="relative flex items-center justify-center mx-auto w-28 h-28">
          {/* Outer glowing pulsing halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-500 to-amber-400 opacity-30 blur-xl animate-pulse" />

          {/* Rotating concentric rings */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin"
            style={{ animationDuration: '12s' }}
          />
          <div
            className="absolute inset-2 rounded-full border-2 border-indigo-400/50 animate-spin"
            style={{ animationDuration: '8s', animationDirection: 'reverse' }}
          />

          {/* Center Orb */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-2xl animate-ai-float">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>

          {/* Orbiting Sparkles */}
          <div className="absolute -top-1 right-2 p-1 bg-amber-400 text-slate-900 rounded-full shadow-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="absolute -bottom-1 left-2 p-1 bg-cyan-400 text-slate-900 rounded-full shadow-md animate-pulse">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Titles & Dynamic Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-300 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI Neural Reasoning in Progress • Phase {activeStep.phase} of 4</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Dynamic Multi-Step Pipeline Tracker */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md text-left space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{activeStep.title}</span>
            </span>
            <span className="font-mono text-cyan-300 font-bold">{activeStep.progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-300 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${activeStep.progress}%` }}
            />
          </div>

          {/* Detail Text with Typewriter Feel */}
          <p className="text-xs text-slate-300 leading-relaxed font-mono min-h-[36px] transition-opacity duration-300">
            {activeStep.detail}
          </p>

          {/* Step Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
            {AI_PIPELINE_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.phase}
                  className={`flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold transition ${
                    isCurrent
                      ? 'bg-white/15 text-white border border-white/30 shadow-xs'
                      : isDone
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-white/5 text-slate-500 border border-transparent'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <StepIcon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? step.color : 'text-slate-500'}`} />
                  )}
                  <span className="truncate">Phase {step.phase}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Neural Telemetry Footer */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            Engine: Gemini-1.5-Pro
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            Inference: Multi-Modal RAG
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            Zero-Hallucination Guard: Active
          </span>
        </div>
      </div>
    </div>
  );
};
