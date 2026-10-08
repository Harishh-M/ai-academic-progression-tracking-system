import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo',
}) => {
  const colorMap = {
    blue: 'bg-blue-50/70 text-[#3B6EA5] border-blue-200/60',
    indigo: 'bg-slate-100 text-[#1E3A5F] border-slate-200',
    emerald: 'bg-emerald-50/70 text-[#3F7D58] border-emerald-200/60',
    amber: 'bg-amber-50/70 text-[#B7791F] border-amber-200/60',
    rose: 'bg-rose-50/70 text-[#B94A48] border-rose-200/60',
    purple: 'bg-slate-100 text-[#1E3A5F] border-slate-200',
  };

  return (
    <div id={id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-[#1E3A5F]">{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg border ${colorMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive === undefined
                  ? 'text-slate-600'
                  : trend.isPositive
                  ? 'text-[#3F7D58]'
                  : 'text-[#B94A48]'
              }`}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
