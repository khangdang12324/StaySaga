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
    <div className="border border-gray-250 bg-white p-5 shadow-sm rounded-sm">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900 md:text-3xl">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trend.isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs font-medium text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}
