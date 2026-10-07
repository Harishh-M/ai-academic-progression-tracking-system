import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  AIAnalysisResult,
  CalculatedAcademicMetrics,
  Student,
  InstitutionalRegulation,
} from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Target,
  Send,
  BookOpen,
  MessageSquare,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const StudentAIInsightsView: React.FC = () => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [metrics, setMetrics] = useState<CalculatedAcademicMetrics | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [regulations, setRegulations] = useState<InstitutionalRegulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; citations?: Array<{ documentTitle: string; clause: string; snippet: string }> }>
  >([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Academic Advisor. Ask me anything regarding your verified grades, weak subject remedies, attendance regulations, or degree requirements.',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      Promise.all([
        api.getStudentById(user.studentId),
        api.getAIAnalysis(user.studentId),
        api.getRegulations(),
      ])
        .then(([stuRes, aiRes, regs]) => {
          setStudent(stuRes.student);
          setMetrics(stuRes.metrics);
          setAnalysis(aiRes);
          setRegulations(regs);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  const handleRefreshAI = async () => {
    if (!user?.studentId) return;
    setRefreshing(true);
    try {
      const fresh = await api.triggerAIAnalysis(user.studentId);
      setAnalysis(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await api.sendAIChat(userText);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.response, citations: res.citations },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Apologies, I encountered an issue accessing the advisor engine. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading || !analysis || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold">Generative AI Academic Intelligence & Diagnostics</h1>
            </div>
            <p className="text-xs text-indigo-200">
              Powered by Google Gemini • Analyzes verified ERP grades, attendance trends, and university academic regulations
            </p>
          </div>

          <button
            id="btn-regenerate-ai"
            onClick={handleRefreshAI}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Re-evaluating...' : 'Regenerate Analysis'}</span>
          </button>
        </div>
      </div>

      {/* AI Performance Summary */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">Comprehensive Performance Appraisal</h2>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge level={analysis.riskLevel} />
            <PerformanceBadge status={metrics.performanceStatus} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-sm text-slate-800 leading-relaxed font-medium">
          {analysis.summary}
        </div>

        {/* Trajectory & Risk Reasons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Performance Trajectory Explanation</span>
            </div>
            <p className="text-slate-700 leading-relaxed">{analysis.performanceTrendExplanation}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Diagnostic Standing Rationale</span>
            </div>
            <ul className="space-y-1 text-slate-700">
              {analysis.riskReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3-Column Diagnostic Matrix: Strengths, Weak Subjects, Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Academic Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {analysis.strengths.map((st, i) => (
              <li key={i} className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{st}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Subjects */}
        <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-rose-100">
            <Target className="w-4 h-4 text-rose-600" />
            <span>Weak Subjects / Attention Areas</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {analysis.weakSubjects.map((ws, i) => (
              <li key={i} className="flex items-start gap-2 bg-rose-50/40 p-2.5 rounded-lg border border-rose-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{ws}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Personalized Recommendations */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-indigo-100">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
            <span>Personalized Recommendations</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {analysis.personalizedRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interactive AI Academic Advisor Chat & RAG Regulations Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Interactive AI Academic Advisor</h3>
              <p className="text-xs text-slate-500">
                Query verified performance data and retrieve cited institutional regulations (RAG)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Self Record Grounded
          </span>
        </div>

        {/* Chat Stream Window */}
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto bg-slate-50/60">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Citations list if present */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="font-bold text-indigo-700 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Cited University Regulations:
                    </div>
                    {msg.citations.map((c, ci) => (
                      <div key={ci} className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-600">
                        <strong className="text-slate-900">{c.documentTitle}</strong> ({c.clause})
                        <div className="italic text-[10px] text-slate-500 mt-0.5">{c.snippet}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Consulting verified academic database & regulations...</span>
            </div>
          )}
        </div>

        {/* Prompt Suggestions Bar */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Try asking:</span>
          <button
            type="button"
            onClick={() => setChatInput('What is the minimum attendance required under Clause 4.2?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 whitespace-nowrap"
          >
            "What is the minimum attendance rule?"
          </button>
          <button
            type="button"
            onClick={() => setChatInput('What are my weakest courses and how can I clear them?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 whitespace-nowrap"
          >
            "What are my weakest subjects?"
          </button>
          <button
            type="button"
            onClick={() => setChatInput('How is my SGPA and CGPA calculated under the grading system?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 whitespace-nowrap"
          >
            "Explain grading system & CGPA formula"
          </button>
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            id="input-ai-chat"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask your AI Academic Advisor regarding your grades, attendance, regulations..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
          />
          <button
            id="btn-send-chat"
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask Advisor</span>
          </button>
        </form>
      </div>
    </div>
  );
};
