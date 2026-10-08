import React from 'react';
import { GradeType } from '../../types/index.js';

interface GradeChipProps {
  grade: GradeType | string;
  points?: number;
  status?: 'Pass' | 'Fail';
}

export const GradeChip: React.FC<GradeChipProps> = ({ grade, points, status }) => {
  const isFail = grade === 'U' || grade === 'RA' || status === 'Fail';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (isFail) {
    colorClasses = 'bg-red-50 text-[#B94A48] border-red-200 font-bold';
  } else if (grade === 'O') {
    colorClasses = 'bg-slate-100 text-[#1E3A5F] border-slate-300 font-bold';
  } else if (grade === 'A+' || grade === 'A') {
    colorClasses = 'bg-emerald-50 text-[#3F7D58] border-emerald-200 font-semibold';
  } else if (grade === 'B+' || grade === 'B') {
    colorClasses = 'bg-blue-50 text-[#3B6EA5] border-blue-200 font-medium';
  } else if (grade === 'C') {
    colorClasses = 'bg-amber-50 text-[#B7791F] border-amber-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs border ${colorClasses}`}>
      <span>Grade {grade}</span>
      {points !== undefined && <span className="opacity-75">({points} pt)</span>}
    </span>
  );
};
