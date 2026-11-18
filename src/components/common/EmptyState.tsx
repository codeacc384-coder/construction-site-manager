import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-white border border-[#E2E8F0] rounded-xl">
      <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#172B4D] font-display">{title}</h3>
      <p className="mt-1 text-xs text-[#64748B] max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
