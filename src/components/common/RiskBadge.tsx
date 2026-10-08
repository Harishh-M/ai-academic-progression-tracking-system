import React from 'react';
import { RiskLevel, PerformanceStatus } from '../../types/index.js';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel | string;
  reasons?: string[];
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, reasons, showIcon = true }) => {
  const norm = level?.toLowerCase();

  let colorClasses = 'bg-emerald-50 text-[#3F7D58] border-emerald-200';
  let Icon = ShieldCheck;
  let label = 'Low Risk';

  if (norm === 'high' || norm === 'at risk') {
    colorClasses = 'bg-red-50 text-[#B94A48] border-red-200';
    Icon = AlertOctagon;
    label = 'High Risk';
  } else if (norm === 'medium' || norm === 'needs improvement') {
    colorClasses = 'bg-amber-50 text-[#B7791F] border-amber-200';
    Icon = AlertTriangle;
    label = 'Medium Risk';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
      title={reasons?.join(' | ')}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </div>
  );
};

export const PerformanceBadge: React.FC<{ status: PerformanceStatus | string }> = ({ status }) => {
  const s = status?.toLowerCase();
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'excellent') bg = 'bg-slate-100 text-[#1E3A5F] border-slate-300 font-semibold';
  else if (s === 'good') bg = 'bg-emerald-50 text-[#3F7D58] border-emerald-200 font-semibold';
  else if (s === 'average') bg = 'bg-blue-50 text-[#3B6EA5] border-blue-200';
  else if (s === 'needs improvement') bg = 'bg-amber-50 text-[#B7791F] border-amber-200';
  else if (s === 'at risk') bg = 'bg-red-50 text-[#B94A48] border-red-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}>
      {status}
    </span>
  );
};
