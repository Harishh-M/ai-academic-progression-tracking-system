import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AchievementRecord, Student } from '../../types/index.js';
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
} from 'lucide-react';

export const FacultyAchievementsView: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedProof, setSelectedProof] = useState<AchievementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const handleUpdateStatus = async (
    achievement: AchievementRecord,
    newStatus: 'Verified' | 'Rejected' | 'Pending'
  ) => {
    try {
      await api.saveAchievement({
        ...achievement,
        verification_status: newStatus,
      });
      setFeedback(`Achievement "${achievement.title}" marked as ${newStatus}.`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update achievement');
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const studentMap = new Map<string, Student>(students.map((s) => [s.id, s]));

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && a.verification_status !== selectedStatus) return false;
    return true;
  });

  const pendingCount = achievements.filter((a) => a.verification_status === 'Pending').length;
  const verifiedCount = achievements.filter((a) => a.verification_status === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Achievement & Co-Curricular Verification</h1>
          <p className="text-xs text-slate-500">
            Validate competitive coding, hackathon wins, research papers, certifications, and awards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Pending Review</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{verifiedCount} Verified</span>
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter By:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="All">All Categories</option>
          <option value="Hackathon">Hackathons & Coding</option>
          <option value="Technical">Technical Competitions</option>
          <option value="Research">Research & Publications</option>
          <option value="Certification">Certifications</option>
          <option value="Academic">Academic Awards</option>
          <option value="Sports">Sports</option>
          <option value="Cultural">Cultural</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Verification</option>
          <option value="Verified">Verified & Conferred</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((ach) => {
          const student = studentMap.get(ach.student_id);
          const isPending = ach.verification_status === 'Pending';
          const isVerified = ach.verification_status === 'Verified';

          return (
            <div
              key={ach.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                    {ach.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
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
                  <h3 className="font-bold text-slate-900 text-base">{ach.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{ach.description}</p>
                </div>

                {student && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="font-bold text-slate-900">{student.student_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {student.register_number} • {student.branch_code}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ach.organization}</span>
                  </div>
                  <button
                    onClick={() => setSelectedProof(ach)}
                    className="text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
                  >
                    Proof <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Faculty Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(ach, 'Verified')}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify Record</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(ach, 'Rejected')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(ach, isVerified ? 'Pending' : 'Verified')}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                    >
                      {isVerified ? 'Revoke Verification' : 'Re-verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Achievement Verification Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">{selectedProof.title}</h4>
              <p className="text-xs text-slate-600">{selectedProof.description}</p>
              <div className="text-xs text-slate-500">
                Awarded by <strong>{selectedProof.organization}</strong> on {selectedProof.achievement_date}
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full">
                  Institutional Category: {selectedProof.category}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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
