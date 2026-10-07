import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AIAnalysisResult, Student, CalculatedAcademicMetrics } from '../../types/index.js';
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
  RefreshCw,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface FacultyAIInsightsViewProps {
  initialStudentId?: string;
}

export const FacultyAIInsightsView: React.FC<FacultyAIInsightsViewProps> = ({ initialStudentId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [studentData, setStudentData] = useState<{ student: Student; metrics: CalculatedAcademicMetrics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; citations?: Array<{ documentTitle: string; clause: string; snippet: string }> }>
  >([
    {
      sender: 'ai',
      text: 'Greetings, Professor! I am your AI Academic Faculty Advisor. Ask me anything about cohort performance, remedial strategies for students with arrears, or institutional regulations and examination clauses.',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getStudents()
      .then((list) => {
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      setAnalyzing(true);
      Promise.all([
        api.getStudentById(selectedStudentId),
        api.getAIAnalysis(selectedStudentId),
      ])
        .then(([stuRes, aiRes]) => {
          setStudentData({ student: stuRes.student, metrics: stuRes.metrics });
          setAnalysis(aiRes);
        })
        .catch(console.error)
        .finally(() => setAnalyzing(false));
    }
  }, [selectedStudentId]);

  const handleTriggerAnalysis = async () => {
    if (!selectedStudentId) return;
    setAnalyzing(true);
    try {
      const fresh = await api.triggerAIAnalysis(selectedStudentId);
      setAnalysis(fresh);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger AI re-analysis');
    } finally {
      setAnalyzing(false);
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
      const res = await api.sendAIChat(userText, selectedStudentId);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.response, citations: res.citations },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error connecting to Gemini advisor backend. Please check network/server.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl text-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold">Faculty AI Academic Intelligence & Diagnostics</h1>
            </div>
            <p className="text-xs text-indigo-200">
              Powered by Google Gemini • Automated student progress appraisals, weak subject detection & regulatory RAG
            </p>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.register_number} - {s.student_name}
                </option>
              ))}
            </select>

            <button
              id="btn-faculty-ai-regenerate"
              onClick={handleTriggerAnalysis}
              disabled={analyzing}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Evaluating...' : 'Re-Analyze'}</span>
            </button>
          </div>
        </div>
      </div>

      {analyzing ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-800">Generating AI Diagnostic Report via Gemini...</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Analyzing student marks, attendance trends, arrear history, and degree regulations
          </p>
        </div>
      ) : analysis && studentData ? (
        <div className="space-y-6">
          {/* AI Comprehensive Appraisal */}
          <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  Diagnostic Appraisal for {studentData.student.student_name} ({studentData.student.register_number})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={analysis.riskLevel} />
                <PerformanceBadge status={studentData.metrics.performanceStatus} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-sm text-slate-800 leading-relaxed font-medium">
              {analysis.summary}
            </div>

            {/* Performance Trend Explanation & Risk Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Longitudinal Trend Diagnostic</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{analysis.performanceTrendExplanation}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Key Risk Triggers & Diagnostic Factors</span>
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

          {/* 3-Column Diagnostic Matrix: Strengths, Weak Subjects, Interventions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Identified Strengths</span>
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

            <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-rose-100">
                <Target className="w-4 h-4 text-rose-600" />
                <span>Weak Courses (Remedial Action)</span>
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

            <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-indigo-100">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                <span>Faculty Recommendations</span>
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
        </div>
      ) : null}

      {/* Interactive Faculty AI Academic Advisor Chat & Grounded RAG Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Faculty Academic Intelligence Assistant</h3>
              <p className="text-xs text-slate-500">
                Query institutional regulations, remedial strategies, or student performance histories
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            University Regulations Grounded
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
              <span>Analyzing student metrics & querying institutional regulations...</span>
            </div>
          )}
        </div>

        {/* Prompt Suggestions Bar */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Faculty Prompts:</span>
          <button
            type="button"
            onClick={() => setChatInput('What are the official university rules for condonation of attendance shortage under Clause 4.2?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 whitespace-nowrap"
          >
            "Attendance condonation rules"
          </button>
          <button
            type="button"
            onClick={() => setChatInput('Suggest a 4-week remedial schedule for students with active arrears in Data Structures (CS3301).')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 whitespace-nowrap"
          >
            "Remedial schedule for CS3301"
          </button>
          <button
            type="button"
            onClick={() => setChatInput('Explain the 10-point Letter Grading and Grade Point formula under Regulation 2023.')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 whitespace-nowrap"
          >
            "Grading system formula"
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            id="input-faculty-ai-chat"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask the AI advisor regarding student diagnostics, remedial plans, exam regulations..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
          />
          <button
            id="btn-faculty-send-chat"
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
