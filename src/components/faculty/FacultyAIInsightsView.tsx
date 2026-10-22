import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  AcademicIntelligenceData,
  Student,
  CalculatedAcademicMetrics,
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
  RefreshCw,
  Clock,
  Info,
} from 'lucide-react';
import { AIGeneratingAnimation } from '../common/AIGeneratingAnimation.js';

interface FacultyAIInsightsViewProps {
  initialStudentId?: string;
}

export const FacultyAIInsightsView: React.FC<FacultyAIInsightsViewProps> = ({ initialStudentId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [analysis, setAnalysis] = useState<AcademicIntelligenceData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [engineName, setEngineName] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<{ student: Student; metrics: CalculatedAcademicMetrics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      Promise.all([
        api.getStudentById(selectedStudentId),
        api.getAcademicIntelligence(selectedStudentId),
      ])
        .then(([stuRes, aiRes]) => {
          setStudentData({ student: stuRes.student, metrics: stuRes.metrics });
          if (aiRes && aiRes.data) {
            setAnalysis(aiRes.data);
            setGeneratedAt(aiRes.generatedAt);
            setEngineName(aiRes.engine);
          }
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || 'Failed to load intelligence data');
        })
        .finally(() => setAnalyzing(false));
    }
  }, [selectedStudentId]);

  const handleTriggerAnalysis = async () => {
    if (!selectedStudentId || analyzing) return;
    setAnalyzing(true);
    setError(null);
    const minAnimationDelay = new Promise((resolve) => setTimeout(resolve, 3200));
    try {
      const [res] = await Promise.all([
        api.analyzeAcademicIntelligence(selectedStudentId),
        minAnimationDelay,
      ]);
      if (res && res.data) {
        setAnalysis(res.data);
        setGeneratedAt(res.generatedAt);
        setEngineName(res.engine);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger Gemini re-analysis');
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

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1E3A5F] rounded-2xl text-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h1 className="text-2xl font-bold">Faculty AI Academic Intelligence & Diagnostics</h1>
            </div>
            <p className="text-xs text-slate-300">
              {engineName || 'Gemini Academic Intelligence Engine'} • Automated student performance appraisals, attention area detection & regulatory RAG
            </p>
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Generated on {formattedDate}</span>
              </div>
            )}
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
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-xs font-semibold text-white border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Evaluating...' : 'Re-Analyze'}</span>
            </button>
          </div>
        </div>
      </div>

      {analyzing ? (
        <AIGeneratingAnimation
          title={`Gemini is compiling academic intelligence for ${studentData?.student.student_name || 'student'}...`}
          subtitle="Cross-referencing continuous assessment scores, attendance thresholds, and statutory university regulations"
        />
      ) : error ? (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-red-900">Analysis Generation Encountered an Issue</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <button
            onClick={handleTriggerAnalysis}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Analysis</span>
          </button>
        </div>
      ) : analysis && studentData ? (
        <div className="space-y-6">
          {/* AI Comprehensive Appraisal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1E3A5F]" />
                <h2 className="font-bold text-slate-900 text-base">
                  Diagnostic Appraisal for {studentData.student.student_name} ({studentData.student.register_number})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={analysis.riskLevel} />
                <PerformanceBadge status={analysis.performanceLevel} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed font-medium">
              {analysis.overallAssessment}
            </div>

            {/* Performance Trend Explanation & Risk Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <TrendingUp className="w-4 h-4 text-[#1E3A5F]" />
                  <span>Performance Trajectory Explanation</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{analysis.trajectoryExplanation}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <AlertTriangle className="w-4 h-4 text-[#B7791F]" />
                  <span>Diagnostic Standing Rationale</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{analysis.diagnosticRationale}</p>
              </div>
            </div>
          </div>

          {/* 3-Column Diagnostic Matrix: Strengths, Attention Areas, Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#3F7D58] font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#3F7D58]" />
                <span>Academic Strengths</span>
              </div>
              {analysis.strengths && analysis.strengths.length > 0 ? (
                <ul className="space-y-2.5 text-xs">
                  {analysis.strengths.map((st, i) => (
                    <li key={i} className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-200/60 space-y-1">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3F7D58] shrink-0" />
                        <span>{st.title}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed pl-3">{st.evidence}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific strengths identified in current records.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#B94A48] font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                <Target className="w-4 h-4 text-[#B94A48]" />
                <span>Weak Subjects / Attention Areas</span>
              </div>
              {analysis.attentionAreas && analysis.attentionAreas.length > 0 ? (
                <ul className="space-y-2.5 text-xs">
                  {analysis.attentionAreas.map((area, i) => (
                    <li key={i} className="bg-red-50/40 p-3 rounded-xl border border-red-200/60 space-y-1.5">
                      <div className="font-bold text-red-950 flex items-center justify-between gap-1">
                        <span className="truncate">{area.subject}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-red-800">{area.issue}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{area.evidence}</p>
                      <div className="text-[11px] text-red-900 bg-red-100/60 p-1.5 rounded-md">
                        <strong>Suggested Action:</strong> {area.suggestedAction}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">Zero critical weak courses or attendance deficits flagged.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#1E3A5F] font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                <Lightbulb className="w-4 h-4 text-[#1E3A5F]" />
                <span>Personalized Recommendations</span>
              </div>
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                <ul className="space-y-2.5 text-xs">
                  {analysis.recommendations.map((rec, i) => {
                    const isHigh = rec.priority === 'High';
                    const isMed = rec.priority === 'Medium';
                    const badgeClass = isHigh
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : isMed
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                    return (
                      <li key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{rec.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                            {rec.priority} Priority
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] italic">{rec.reason}</p>
                        <p className="text-slate-800 text-[11px] leading-relaxed font-medium bg-white p-2 rounded-lg border border-slate-100">
                          {rec.action}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No immediate academic recommendations generated.</p>
              )}
            </div>
          </div>

          {/* Data Scope & Limitations */}
          {analysis.dataLimitations && analysis.dataLimitations.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs pb-2 border-b border-slate-200/60 mb-2">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Institutional Data Scope & Limitations</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 pl-5 list-disc">
                {analysis.dataLimitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* AI Advisory Query Assistant (Faculty Chat) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1E3A5F]" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Faculty Advisor Assistant</h3>
              <p className="text-xs text-slate-500">
                Inquire about selected student progress, remedial interventions, or regulatory clauses
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Advisory Console
          </span>
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto bg-slate-50/60">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#1E3A5F] text-white shadow-xs rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="font-bold text-[#1E3A5F] flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Cited Institutional Regulations:
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
            <div className="flex items-center gap-2 text-xs text-[#1E3A5F] font-medium">
              <span className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing academic records & querying regulations...</span>
            </div>
          )}
        </div>

        {/* Suggestion Prompts */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Suggested:</span>
          <button
            type="button"
            onClick={() => setChatInput(`What remedial actions are mandated for ${studentData?.student.student_name || 'this student'}?`)}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-[#1E3A5F] text-slate-700 whitespace-nowrap cursor-pointer"
          >
            "Mandated remedial actions"
          </button>
          <button
            type="button"
            onClick={() => setChatInput('What are the statutory attendance requirements to sit for semester examinations?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-[#1E3A5F] text-slate-700 whitespace-nowrap cursor-pointer"
          >
            "Examination attendance rules"
          </button>
          <button
            type="button"
            onClick={() => setChatInput('Summarize the arrear clearance and supplementary examination guidelines.')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-[#1E3A5F] text-slate-700 whitespace-nowrap cursor-pointer"
          >
            "Arrear clearance rules"
          </button>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            id="input-faculty-ai-chat"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask questions about student trajectory, remediation plans, or regulatory clauses..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] focus:bg-white transition"
          />
          <button
            id="btn-faculty-send-chat"
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#16304F] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consult Advisor</span>
          </button>
        </form>
      </div>
    </div>
  );
};
