import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { AchievementRecord } from '../../types/index.js';
import {
  Award,
  CheckCircle2,
  Clock,
  Building,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

export const StudentAchievementsView: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<AchievementRecord | null>(null);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getAchievements(user.studentId)
        .then(setAchievements)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const verifiedCount = achievements.filter((a) => a.verification_status === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Achievements & Co-Curricular Portfolio</h1>
          <p className="text-xs text-slate-500">
            Verified academic, competitive programming, hackathon, and co-curricular awards
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#3F7D58]" />
          <span>{verifiedCount} Verified Institutional Records</span>
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => {
          const isVerified = ach.verification_status === 'Verified';

          return (
            <div
              key={ach.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-[#1E3A5F] border border-slate-200 uppercase tracking-wider">
                    {ach.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      isVerified
                        ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                        : 'bg-amber-50 text-[#B7791F] border-amber-200'
                    }`}
                  >
                    {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{ach.verification_status}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{ach.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{ach.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-700">{ach.organization}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ach.achievement_date}</span>
                  </div>

                  <button
                    onClick={() => setSelectedCert(ach)}
                    className="text-xs font-semibold text-[#1E3A5F] hover:underline flex items-center gap-1"
                  >
                    View Credential <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#B7791F]" />
                <h3 className="font-bold text-slate-900 text-base">Verified Achievement Certificate</h3>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-[#B7791F] flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">{selectedCert.title}</h4>
              <p className="text-xs text-slate-600">{selectedCert.description}</p>
              <div className="text-xs text-slate-500">
                Conferred by <strong>{selectedCert.organization}</strong> on {selectedCert.achievement_date}
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3F7D58] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" /> Faculty Endorsed & Verified in ERP
                </span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#16304F] transition"
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
