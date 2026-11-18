import React from 'react';
import { cn } from '../../utils/format';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

const TONE_MAP: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function inferStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (
    s.includes('present') ||
    s.includes('active') ||
    s.includes('approved') ||
    s.includes('verified') ||
    s.includes('completed') ||
    s.includes('normal') ||
    s.includes('on track') ||
    s.includes('compliant') ||
    s.includes('paid') ||
    s.includes('resolved') ||
    s.includes('closed') ||
    s.includes('reviewed')
  ) {
    return 'success';
  }
  if (
    s.includes('critical') ||
    s.includes('absent') ||
    s.includes('rejected') ||
    s.includes('out of stock') ||
    s.includes('out of service') ||
    s.includes('blocked') ||
    s.includes('flagged') ||
    s.includes('disputed') ||
    s.includes('high') ||
    s.includes('outside')
  ) {
    return 'danger';
  }
  if (
    s.includes('pending') ||
    s.includes('late') ||
    s.includes('low stock') ||
    s.includes('warning') ||
    s.includes('maintenance') ||
    s.includes('delayed') ||
    s.includes('stale') ||
    s.includes('clarification') ||
    s.includes('missing') ||
    s.includes('partial') ||
    s.includes('medium') ||
    s.includes('escalated') ||
    s.includes('action required') ||
    s.includes('open')
  ) {
    return 'warning';
  }
  if (s.includes('progress') || s.includes('forwarded') || s.includes('submitted') || s.includes('expected') || s.includes('scheduled') || s.includes('assigned')) {
    return 'info';
  }
  return 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone, className }) => {
  const resolvedTone = tone ?? inferStatusTone(label);
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0',
        TONE_MAP[resolvedTone],
        className
      )}
    >
      {label}
    </span>
  );
};
