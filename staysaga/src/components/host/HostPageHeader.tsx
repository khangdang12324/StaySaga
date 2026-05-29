import Link from "next/link";
import { type ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HostPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function HostPageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: HostPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-gray-200 pb-5">
      <div className="space-y-1.5">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Link href="/host" className="hover:text-[#f60057] transition-colors">
              Trang chủ Host
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <span>/</span>
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#f60057] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-700">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 md:text-3xl tracking-tight">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-sm font-medium text-slate-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
