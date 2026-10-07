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
    colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  } else if (grade === 'O') {
    colorClasses = 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
  } else if (grade === 'A+' || grade === 'A') {
    colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
  } else if (grade === 'B+' || grade === 'B') {
    colorClasses = 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
  } else if (grade === 'C') {
    colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs border ${colorClasses}`}>
      <span>Grade {grade}</span>
      {points !== undefined && <span className="opacity-70">({points} pt)</span>}
    </span>
  );
};
