import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { AchievementRecord, AchievementCategory, VerificationLink, DynamicField } from '../../types/index.js';
import {
  Award,
  CheckCircle2,
  Clock,
  Building,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Trophy,
  Plus,
  Trash2,
  X,
  Filter,
  AlertCircle,
  FileText,
  Sparkles,
  Link as LinkIcon,
  Check,
  Globe,
  Tag,
} from 'lucide-react';

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  Hackathon: ['Team Name', 'Project GitHub Repo', 'Position / Rank', 'Problem Track / Theme'],
  'Paper Presentation': ['Paper Title', 'DOI Number', 'Conference / Journal Name', 'Indexing (IEEE/Scopus)'],
  'Technical Symposium': ['Event Name', 'Prize / Standing', 'College / Venue', 'Event Category'],
  Certification: ['Credential ID', 'Verification Portal URL', 'Score / Grade', 'Validity / Expiry Date'],
  'Project Competition': ['Project Demo URL', 'Faculty Mentor Name', 'Hardware / Software Stack', 'Prize Amount'],
  Coding: ['Platform Profile URL', 'Global Rank / Percentile', 'Problems Solved', 'Contest Rating'],
  Workshop: ['Course Duration (Hours)', 'Specialization / Topics Covered', 'Trainer / Institution'],
  Sports: ['Medal / Standing', 'Event Level (State/National)', 'Category / Weight Class'],
  Cultural: ['Award / Title', 'Conclave / Festival Name', 'Solo / Group Performance'],
};

export const StudentAchievementsView: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<AchievementRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    category: AchievementCategory;
    organization: string;
    achievement_date: string;
    description: string;
  }>({
    title: '',
    category: 'Hackathon',
    organization: '',
    achievement_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Dynamic Fields State
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([
    { id: '1', key: 'Team Name', value: '' },
    { id: '2', key: 'Project Repo / Demo', value: '' },
  ]);

  // Verification Links State
  const [verificationLinks, setVerificationLinks] = useState<VerificationLink[]>([
    { label: 'Official Certificate PDF / Credential Link', url: '' },
  ]);

  const loadAchievements = () => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getAchievements(user.studentId)
        .then(setAchievements)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadAchievements();
  }, [user?.studentId]);

  const handleCategoryChange = (newCat: AchievementCategory) => {
    setFormData((prev) => ({ ...prev, category: newCat }));
    // Update default dynamic fields suggestion if currently empty or default
    const suggestions = CATEGORY_SUGGESTIONS[newCat] || [];
    if (suggestions.length >= 2) {
      setDynamicFields([
        { id: 'df_' + Date.now() + '_1', key: suggestions[0], value: '' },
        { id: 'df_' + Date.now() + '_2', key: suggestions[1], value: '' },
      ]);
    }
  };

  const addDynamicField = (keyName = '') => {
    setDynamicFields((prev) => [
      ...prev,
      { id: 'df_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6), key: keyName, value: '' },
    ]);
  };

  const removeDynamicField = (id: string) => {
    setDynamicFields((prev) => prev.filter((df) => df.id !== id));
  };

  const updateDynamicField = (id: string, field: 'key' | 'value', text: string) => {
    setDynamicFields((prev) =>
      prev.map((df) => (df.id === id ? { ...df, [field]: text } : df))
    );
  };

  const addVerificationLink = () => {
    setVerificationLinks((prev) => [
      ...prev,
      { label: 'Verification / Proof Link', url: '' },
    ]);
  };

  const removeVerificationLink = (index: number) => {
    setVerificationLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateVerificationLink = (index: number, field: 'label' | 'url', val: string) => {
    setVerificationLinks((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, [field]: val } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.organization.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a title and issuing organization.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    // Filter valid dynamic fields
    const dynamicFieldsObj: Record<string, string> = {};
    for (const df of dynamicFields) {
      if (df.key.trim() && df.value.trim()) {
        dynamicFieldsObj[df.key.trim()] = df.value.trim();
      }
    }

    // Filter valid verification links
    const validLinks = verificationLinks
      .filter((l) => l.url.trim().length > 0)
      .map((l) => ({
        label: l.label.trim() || 'Proof / Credential Link',
        url: l.url.trim(),
      }));

    try {
      await api.saveAchievement({
        student_id: user?.studentId || '1',
        title: formData.title.trim(),
        category: formData.category,
        organization: formData.organization.trim(),
        achievement_date: formData.achievement_date,
        description: formData.description.trim(),
        certificate_file: validLinks.length > 0 ? validLinks[0].url : undefined,
        verification_status: 'Pending',
        dynamic_fields: Object.keys(dynamicFieldsObj).length > 0 ? dynamicFieldsObj : undefined,
        verification_links: validLinks.length > 0 ? validLinks : undefined,
      });

      setFeedback({
        type: 'success',
        message: 'Achievement and verification links submitted successfully! Now pending faculty mentor approval.',
      });
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'Hackathon',
        organization: '',
        achievement_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setDynamicFields([
        { id: '1', key: 'Team Name', value: '' },
        { id: '2', key: 'Project Repo / Demo', value: '' },
      ]);
      setVerificationLinks([{ label: 'Official Certificate PDF / Credential Link', url: '' }]);
      loadAchievements();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to submit achievement for approval.',
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const verifiedCount = achievements.filter((a) => a.verification_status === 'Verified').length;
  const pendingCount = achievements.filter((a) => a.verification_status === 'Pending').length;

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    if (statusFilter !== 'All' && a.verification_status !== statusFilter) return false;
    return true;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Achievements & Co-Curricular Portfolio</h1>
          <p className="text-xs text-slate-500">
            Submit, track, and verify competitive programming, hackathon wins, research papers, certifications & awards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#3F7D58]">
              <ShieldCheck className="w-4 h-4 text-[#3F7D58]" />
              <span>{verifiedCount} Verified</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-[#B7791F]">
              <Clock className="w-4 h-4 text-[#B7791F]" />
              <span>{pendingCount} Awaiting Faculty Review</span>
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Achievement</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-[#B94A48]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#3F7D58] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#B94A48] shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter Portfolio:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            <option value="All">All Categories</option>
            <option value="Hackathon">Hackathons</option>
            <option value="Paper Presentation">Paper Presentations</option>
            <option value="Technical Symposium">Technical Symposia</option>
            <option value="Certification">Certifications</option>
            <option value="Project Competition">Project Competitions</option>
            <option value="Coding">Competitive Coding</option>
            <option value="Workshop">Workshops</option>
            <option value="Sports">Sports</option>
            <option value="Cultural">Cultural</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Faculty Verification</option>
            <option value="Verified">Verified & Conferred</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid of Achievements */}
      {filteredAchievements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No achievements found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {achievements.length === 0
              ? 'You have not added any achievements yet. Click "Add Achievement" above to submit your credentials to your faculty mentor.'
              : 'No achievements match the selected category or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((ach) => {
            const isVerified = ach.verification_status === 'Verified';
            const isPending = ach.verification_status === 'Pending';
            const links = ach.verification_links && ach.verification_links.length > 0
              ? ach.verification_links
              : ach.certificate_file
              ? [{ label: 'Official Proof Link', url: ach.certificate_file }]
              : [];

            return (
              <div
                key={ach.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-[#1E3A5F] border border-slate-200 uppercase tracking-wider">
                      {ach.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        isVerified
                          ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                          : isPending
                          ? 'bg-amber-50 text-[#B7791F] border-amber-200'
                          : 'bg-red-50 text-[#B94A48] border-red-200'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isPending ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{ach.verification_status}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{ach.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">{ach.description}</p>
                  </div>

                  {/* Dynamic Fields Badges */}
                  {ach.dynamic_fields && Object.keys(ach.dynamic_fields).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Achievement Attributes
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {Object.entries(ach.dynamic_fields).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="bg-white px-2 py-1 rounded border border-slate-200/80">
                            <span className="text-slate-500 font-medium">{k}: </span>
                            <span className="text-slate-900 font-semibold truncate block">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{ach.organization}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ach.achievement_date}</span>
                    </div>

                    <button
                      onClick={() => setSelectedCert(ach)}
                      className="text-xs font-semibold text-[#1E3A5F] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Verify Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Verification Links Preview */}
                  {links.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {links.slice(0, 2).map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1E3A5F] border border-blue-200 hover:bg-blue-100 transition"
                        >
                          <LinkIcon className="w-3 h-3 text-[#1E3A5F]" />
                          <span className="truncate max-w-[130px]">{l.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      ))}
                      {links.length > 2 && (
                        <span className="text-[10px] text-slate-400 font-semibold">+{links.length - 2} more</span>
                      )}
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-1 p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-[#B7791F] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Submitted to Faculty Advisor for review</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Achievement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Submit Co-Curricular Achievement</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Achievement Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Smart India Hackathon 2025 - Winner"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as AchievementCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Paper Presentation">Paper Presentation</option>
                    <option value="Technical Symposium">Technical Symposium</option>
                    <option value="Certification">Certification</option>
                    <option value="Project Competition">Project Competition</option>
                    <option value="Coding">Competitive Coding</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date Conferred *
                  </label>
                  <input
                    type="date"
                    value={formData.achievement_date}
                    onChange={(e) => setFormData({ ...formData, achievement_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Issuing Organization / Authority *
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. AICTE, IEEE, Amazon Web Services, IIT Madras"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Abstract
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize project scope, problem statement, team role, or performance rank..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              {/* Dynamic Fields Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <Tag className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <span>Dynamic Achievement Attributes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDynamicField()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-semibold text-[#1E3A5F] hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom Field</span>
                  </button>
                </div>

                {/* Suggestions Pills for this category */}
                {CATEGORY_SUGGESTIONS[formData.category] && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-slate-400 font-medium">Quick Suggestions:</span>
                    {CATEGORY_SUGGESTIONS[formData.category].map((sugg) => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => addDynamicField(sugg)}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition cursor-pointer"
                      >
                        + {sugg}
                      </button>
                    ))}
                  </div>
                )}

                {/* Fields List */}
                <div className="space-y-2">
                  {dynamicFields.map((df) => (
                    <div key={df.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={df.key}
                        onChange={(e) => updateDynamicField(df.id, 'key', e.target.value)}
                        placeholder="Field Name (e.g. Team Name)"
                        className="w-1/3 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-[#1E3A5F] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={df.value}
                        onChange={(e) => updateDynamicField(df.id, 'value', e.target.value)}
                        placeholder="Field Value (e.g. CodeCrafters / 1st Place)"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-[#1E3A5F] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeDynamicField(df.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                        title="Remove Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification & Proof Links Section */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <LinkIcon className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <span>Verification & Proof Links (For Faculty Validation)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addVerificationLink}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-blue-300 text-[11px] font-semibold text-[#1E3A5F] hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Link</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide verifiable URLs (Official certificate PDF, Issuing portal validation link, GitHub repo, or project demo) so faculty can verify the details.
                </p>

                <div className="space-y-2.5">
                  {verificationLinks.map((link, idx) => (
                    <div key={idx} className="space-y-1 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateVerificationLink(idx, 'label', e.target.value)}
                          placeholder="Link Label (e.g. Certificate PDF, Credly Portal, GitHub Repo)"
                          className="w-1/3 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 text-[11px] focus:ring-1 focus:ring-[#1E3A5F] focus:outline-none font-medium"
                        />
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateVerificationLink(idx, 'url', e.target.value)}
                            placeholder="https://example.com/certificate.pdf"
                            className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:ring-1 focus:ring-[#1E3A5F] focus:outline-none font-mono"
                          />
                          {link.url && (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#1E3A5F] text-[11px] font-semibold rounded flex items-center gap-1 shrink-0"
                              title="Test Link in New Tab"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {verificationLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVerificationLink(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#1E3A5F] hover:bg-[#16304F] text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span>Submit for Faculty Approval</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate / Credential Dossier Modal with Verification Links */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#B7791F]" />
                <h3 className="font-bold text-slate-900 text-base">Achievement Verification Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-[#B7791F] flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">{selectedCert.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedCert.description}</p>
              <div className="text-xs text-slate-500">
                Conferred by <strong>{selectedCert.organization}</strong> on {selectedCert.achievement_date}
              </div>

              {/* Dynamic Fields List */}
              {selectedCert.dynamic_fields && Object.keys(selectedCert.dynamic_fields).length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Custom Attributes & Details
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedCert.dynamic_fields).map(([k, v]) => (
                      <div key={k} className="p-1.5 bg-slate-50 rounded border border-slate-200/80">
                        <span className="text-slate-500 font-medium block text-[10px]">{k}</span>
                        <span className="text-slate-900 font-semibold text-xs break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification & Proof Links */}
              {((selectedCert.verification_links && selectedCert.verification_links.length > 0) || selectedCert.certificate_file) && (
                <div className="mt-3 p-3.5 rounded-lg bg-white border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Globe className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <span>Verifiable Credential Links</span>
                  </div>
                  <div className="space-y-1.5">
                    {(selectedCert.verification_links && selectedCert.verification_links.length > 0
                      ? selectedCert.verification_links
                      : [{ label: 'Official Proof Link', url: selectedCert.certificate_file! }]
                    ).map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <LinkIcon className="w-3.5 h-3.5 text-[#1E3A5F] shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-slate-800 text-xs">{link.label}</div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">{link.url}</div>
                          </div>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-[#1E3A5F] text-white text-[11px] font-semibold hover:bg-[#16304F] transition flex items-center gap-1 shrink-0"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                    selectedCert.verification_status === 'Verified'
                      ? 'text-[#3F7D58] bg-emerald-50 border-emerald-200'
                      : 'text-[#B7791F] bg-amber-50 border-amber-200'
                  }`}
                >
                  {selectedCert.verification_status === 'Verified' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Faculty Endorsed & Verified in ERP
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" /> Pending Faculty Advisor Endorsement
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#16304F] transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
