import { type ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="border border-slate-200 bg-white p-6 shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#f60057]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold ${
              trend.isPositive 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs font-medium text-slate-500 leading-normal">
          {description}
        </p>
      )}
    </div>
  );
}
