import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { cn } from '../../utils/format';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSite, siteNotifications } = useSiteContext();
  const markNotificationRead = useBuildFlowStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useBuildFlowStore((s) => s.markAllNotificationsRead);

  const [catFilter, setCatFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (catFilter === 'ALL') return siteNotifications;
    return siteNotifications.filter((n) => n.category === catFilter);
  }, [siteNotifications, catFilter]);

  return (
    <div>
      <PageHeader
        title="Notifications & Site Alerts"
        description={`Real-time alert feed scoped to ${activeSite.name}. Structured for Supabase Realtime integration.`}
        breadcrumbs={[{ label: 'Site Management', to: '/' }, { label: 'Notifications' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead(activeSite.id);
              toast.success('Marked all notifications for this site as read');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </button>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'Safety', 'Procurement', 'Attendance', 'Equipment', 'Approvals'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border',
                  catFilter === cat
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0]'
                )}
              >
                {cat === 'ALL' ? `All (${siteNotifications.length})` : cat}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id);
              navigate(n.targetRoute);
            }}
            className={cn(
              'p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#F5F7FA] transition-colors',
              !n.read && 'bg-[#EFF6FF]/50'
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  !n.read ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-[#64748B]'
                )}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#172B4D]">{n.title}</span>
                  <StatusBadge label={n.category} tone="neutral" />
                  {!n.read && <StatusBadge label="Unread" tone="info" />}
                </div>
                <p className="text-xs text-[#64748B] mt-1">{n.message}</p>
              </div>
            </div>
            <span className="font-mono text-xs text-[#64748B] shrink-0">{n.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
