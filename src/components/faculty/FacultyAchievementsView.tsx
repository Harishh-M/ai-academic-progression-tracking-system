import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { AchievementRecord, Student, VerificationLink } from '../../types/index.js';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Trophy,
  Filter,
  Check,
  X,
  Search,
  Users,
  CheckCheck,
  Link as LinkIcon,
  Globe,
  Tag,
  AlertTriangle,
} from 'lucide-react';

export const FacultyAchievementsView: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [menteesOnly, setMenteesOnly] = useState<boolean>(false);
  const [selectedProof, setSelectedProof] = useState<AchievementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Verification Checklist State inside Dossier Modal
  const [checklist, setChecklist] = useState<{
    linkChecked: boolean;
    orgChecked: boolean;
    studentAttributionChecked: boolean;
  }>({
    linkChecked: false,
    orgChecked: false,
    studentAttributionChecked: false,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getAchievements(), api.getStudents()])
      .then(([achList, stuList]) => {
        setAchievements(achList);
        setStudents(stuList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDossier = (ach: AchievementRecord) => {
    setSelectedProof(ach);
    setChecklist({
      linkChecked: false,
      orgChecked: false,
      studentAttributionChecked: false,
    });
  };

  const handleUpdateStatus = async (
    achievement: AchievementRecord,
    newStatus: 'Verified' | 'Rejected' | 'Pending'
  ) => {
    try {
      await api.saveAchievement({
        ...achievement,
        verification_status: newStatus,
      });
      setFeedback({
        type: 'success',
        message: `Achievement "${achievement.title}" marked as ${newStatus}.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update achievement status.',
      });
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleBatchApprove = async (pendingList: AchievementRecord[]) => {
    if (pendingList.length === 0) return;
    if (!window.confirm(`Are you sure you want to approve and verify ${pendingList.length} pending achievement(s)?`)) {
      return;
    }

    setBatchLoading(true);
    try {
      await Promise.all(
        pendingList.map((ach) =>
          api.saveAchievement({
            ...ach,
            verification_status: 'Verified',
          })
        )
      );
      setFeedback({
        type: 'success',
        message: `Successfully approved and verified ${pendingList.length} achievements!`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to batch approve achievements.',
      });
    } finally {
      setBatchLoading(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const studentMap = new Map<string, Student>(students.map((s) => [s.id, s]));

  // Filtering
  const filteredAchievements = achievements.filter((a) => {
    const student = studentMap.get(a.student_id);

    // Filter by mentees only
    if (menteesOnly && user?.facultyId) {
      if (student?.assigned_faculty_id !== user.facultyId) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'All' && a.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'All' && a.verification_status !== selectedStatus) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchOrg = a.organization?.toLowerCase().includes(q);
      const matchDesc = a.description?.toLowerCase().includes(q);
      const matchStuName = student?.student_name.toLowerCase().includes(q);
      const matchReg = student?.register_number.toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchDesc && !matchStuName && !matchReg) {
        return false;
      }
    }

    return true;
  });

  const pendingCount = achievements.filter((a) => a.verification_status === 'Pending').length;
  const verifiedCount = achievements.filter((a) => a.verification_status === 'Verified').length;
  const rejectedCount = achievements.filter((a) => a.verification_status === 'Rejected').length;

  const filteredPending = filteredAchievements.filter((a) => a.verification_status === 'Pending');

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
          <h1 className="text-2xl font-bold text-slate-900">Student Achievement & Co-Curricular Verification</h1>
          <p className="text-xs text-slate-500">
            Validate proofs, check external credential links, inspect dynamic fields, and confer institutional endorsements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-[#B7791F]">
            <Clock className="w-4 h-4 text-[#B7791F]" />
            <span>{pendingCount} Pending Review</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#3F7D58]">
            <ShieldCheck className="w-4 h-4 text-[#3F7D58]" />
            <span>{verifiedCount} Verified</span>
          </span>

          {filteredPending.length > 0 && (
            <button
              onClick={() => handleBatchApprove(filteredPending)}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3F7D58] hover:bg-[#346748] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All {filteredPending.length} in View</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-[#B94A48]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#3F7D58]" />
          ) : (
            <XCircle className="w-4 h-4 text-[#B94A48]" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, register number, title, or organization..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
            />
          </div>

          {/* Mentee Scope Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setMenteesOnly(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                !menteesOnly ? 'bg-white shadow-2xs text-[#1E3A5F]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Students ({achievements.length})
            </button>
            <button
              onClick={() => setMenteesOnly(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                menteesOnly ? 'bg-white shadow-2xs text-[#1E3A5F]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Assigned Mentees</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Filter By:</span>
          </div>

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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            <option value="All">All Statuses ({achievements.length})</option>
            <option value="Pending">Pending Review ({pendingCount})</option>
            <option value="Verified">Verified & Conferred ({verifiedCount})</option>
            <option value="Rejected">Rejected ({rejectedCount})</option>
          </select>

          {(selectedCategory !== 'All' || selectedStatus !== 'All' || searchQuery || menteesOnly) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSearchQuery('');
                setMenteesOnly(false);
              }}
              className="text-[#1E3A5F] hover:underline text-xs font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Achievements Cards Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No achievements found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, status, category, or mentee filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((ach) => {
            const student = studentMap.get(ach.student_id);
            const isPending = ach.verification_status === 'Pending';
            const isVerified = ach.verification_status === 'Verified';
            const isMyMentee = user?.facultyId && student?.assigned_faculty_id === user.facultyId;

            const links = ach.verification_links && ach.verification_links.length > 0
              ? ach.verification_links
              : ach.certificate_file
              ? [{ label: 'Official Proof Link', url: ach.certificate_file }]
              : [];

            return (
              <div
                key={ach.id}
                className={`bg-white rounded-2xl border shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-200/50 bg-gradient-to-b from-amber-50/20 to-white' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-[#1E3A5F] border border-slate-200 uppercase tracking-wider">
                        {ach.category}
                      </span>
                      {isMyMentee && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E3A5F] border border-blue-200">
                          My Mentee
                        </span>
                      )}
                    </div>

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
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{ach.verification_status}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{ach.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">{ach.description}</p>
                  </div>

                  {student && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{student.student_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {student.register_number} • {student.branch_code}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        Batch: <span className="font-semibold text-slate-700">{student.batch}</span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields Snapshot */}
                  {ach.dynamic_fields && Object.keys(ach.dynamic_fields).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>Dynamic Fields</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {Object.entries(ach.dynamic_fields).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="bg-white p-1 rounded border border-slate-200/80 truncate">
                            <span className="text-slate-500 font-medium">{k}: </span>
                            <span className="text-slate-900 font-semibold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ach.organization}</span>
                    </div>

                    <button
                      onClick={() => openDossier(ach)}
                      className="text-[#1E3A5F] font-semibold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      Verify Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>Conferred: {ach.achievement_date}</span>
                  </div>

                  {/* Verification Links Preview on Card */}
                  {links.length > 0 && (
                    <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-200/60 space-y-1.5">
                      <div className="text-[10px] font-bold text-[#1E3A5F] flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Submitted Proof Links ({links.length}):</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {links.slice(0, 2).map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-2 py-1 bg-white rounded border border-blue-200/80 hover:bg-blue-50 text-[11px] text-[#1E3A5F] font-medium transition"
                          >
                            <span className="truncate max-w-[170px]">{l.label}</span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1E3A5F] shrink-0">
                              Verify <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval Actions */}
                  <div className="pt-1">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(ach, 'Verified')}
                          className="flex-1 px-3 py-2 rounded-lg bg-[#3F7D58] hover:bg-[#346748] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Verify</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ach, 'Rejected')}
                          className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-[#B94A48] font-bold text-xs border border-red-200 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          {isVerified ? 'Verified & recorded in ERP' : 'Marked as rejected'}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(ach, isVerified ? 'Pending' : 'Verified')}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] transition cursor-pointer"
                        >
                          {isVerified ? 'Revoke to Pending' : 'Re-verify'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof / Verification Dossier Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#B7791F]" />
                <h3 className="font-bold text-slate-900 text-base">Achievement Verification Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-[#B7791F] flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">{selectedProof.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedProof.description}</p>
              <div className="text-xs text-slate-500">
                Awarded by <strong>{selectedProof.organization}</strong> on {selectedProof.achievement_date}
              </div>

              {/* Dynamic Fields Inspector in Dossier */}
              {selectedProof.dynamic_fields && Object.keys(selectedProof.dynamic_fields).length > 0 && (
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 text-left text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <span>Dynamic Attributes Provided by Student</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedProof.dynamic_fields).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">{k}</div>
                        <div className="font-semibold text-slate-900 mt-0.5 break-all">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dedicated Verifiable Links Section */}
              {((selectedProof.verification_links && selectedProof.verification_links.length > 0) || selectedProof.certificate_file) && (
                <div className="mt-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-left text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#1E3A5F] flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#1E3A5F]" />
                      <span>Verifiable External Proof Links</span>
                    </div>
                    <span className="text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      Click to Test & Verify
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(selectedProof.verification_links && selectedProof.verification_links.length > 0
                      ? selectedProof.verification_links
                      : [{ label: 'Official Proof / Certificate File', url: selectedProof.certificate_file! }]
                    ).map((link, idx) => {
                      let hostname = '';
                      try {
                        hostname = new URL(link.url).hostname;
                      } catch {}

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-[#1E3A5F] transition"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <LinkIcon className="w-4 h-4 text-[#1E3A5F] shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-slate-900 text-xs">{link.label}</div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">{link.url}</div>
                              {hostname && (
                                <span className="inline-block mt-0.5 text-[10px] text-slate-400 font-medium">
                                  Domain: {hostname}
                                </span>
                              )}
                            </div>
                          </div>

                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold hover:bg-[#16304F] transition flex items-center gap-1.5 shrink-0 shadow-2xs"
                          >
                            <span>Open & Verify</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faculty Verification Checklist (Interactive) */}
              {selectedProof.verification_status === 'Pending' && (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-left text-xs space-y-2">
                  <div className="font-bold text-[#B7791F] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#B7791F]" />
                    <span>Faculty Verification Checklist</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklist.linkChecked}
                        onChange={(e) => setChecklist({ ...checklist, linkChecked: e.target.checked })}
                        className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F] h-4 w-4"
                      />
                      <span>Verified external proof link / certificate authenticity</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklist.orgChecked}
                        onChange={(e) => setChecklist({ ...checklist, orgChecked: e.target.checked })}
                        className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F] h-4 w-4"
                      />
                      <span>Verified issuing authority, dates, and event level</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklist.studentAttributionChecked}
                        onChange={(e) => setChecklist({ ...checklist, studentAttributionChecked: e.target.checked })}
                        className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F] h-4 w-4"
                      />
                      <span>Confirmed student authorship / team participation</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-200/80 px-3 py-1 rounded-full">
                  Institutional Category: {selectedProof.category}
                </span>
              </div>
            </div>

            {/* Actions inside modal */}
            {selectedProof.verification_status === 'Pending' && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedProof, 'Verified');
                    setSelectedProof(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#3F7D58] hover:bg-[#346748] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Verify Record</span>
                </button>
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedProof, 'Rejected');
                    setSelectedProof(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#B94A48] font-bold text-xs border border-red-200 transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
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
