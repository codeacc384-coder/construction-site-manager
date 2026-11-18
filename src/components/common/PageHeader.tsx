import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/format';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  filters,
  className,
}) => {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#64748B] flex-wrap">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={item.label}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {item.to ? (
                <Link to={item.to} className="hover:text-[#172B4D] transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#172B4D] font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D] font-display leading-snug">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-[#64748B] max-w-3xl leading-relaxed">{description}</p>
          )}
        </div>
        {(secondaryActions || primaryAction) && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {filters && (
        <div className="pt-1 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {filters}
        </div>
      )}
    </div>
  );
};
