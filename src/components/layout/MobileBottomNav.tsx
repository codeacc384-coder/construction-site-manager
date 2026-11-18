import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  MapPinCheck,
  Menu,
  X,
} from 'lucide-react';
import { SITE_MANAGER_NAV } from './navigation';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { cn } from '../../utils/format';

export const MobileBottomNav: React.FC = () => {
  const { pendingApprovalCount } = useSiteContext();
  const setMobileDrawerOpen = useBuildFlowStore((s) => s.setMobileDrawerOpen);

  const quickTabs = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Operations', path: '/daily-operations', icon: ClipboardList },
    { label: 'Attendance', path: '/attendance', icon: MapPinCheck },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare, badge: pendingApprovalCount },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E2E8F0] h-14 px-1 flex items-center justify-around"
    >
      {quickTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center min-w-[60px] h-11 rounded-lg text-[11px] font-medium transition-colors',
                isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
              )
            }
          >
            <Icon className="w-4.5 h-4.5" />
            <span className="mt-0.5 leading-none">{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-1 right-2 px-1 min-w-[15px] h-3.5 rounded bg-[#DC2626] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
          </NavLink>
        );
      })}

      <button
        type="button"
        onClick={() => setMobileDrawerOpen(true)}
        className="flex flex-col items-center justify-center min-w-[60px] h-11 rounded-lg text-[11px] font-medium text-[#64748B] hover:text-[#172B4D]"
      >
        <Menu className="w-4.5 h-4.5" />
        <span className="mt-0.5 leading-none">Modules</span>
      </button>
    </nav>
  );
};

export const MobileNavDrawer: React.FC = () => {
  const { pendingApprovalCount, openSafetyCount, unreadNotificationsCount, activeSite } = useSiteContext();
  const mobileDrawerOpen = useBuildFlowStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useBuildFlowStore((s) => s.setMobileDrawerOpen);

  if (!mobileDrawerOpen) return null;

  const getBadge = (key?: 'approvals' | 'notifications' | 'safety') => {
    if (key === 'approvals') return pendingApprovalCount;
    if (key === 'notifications') return unreadNotificationsCount;
    if (key === 'safety') return openSafetyCount;
    return 0;
  };

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/60"
      onClick={() => setMobileDrawerOpen(false)}
    >
      <div
        className="w-[290px] max-w-[85vw] h-full bg-[#101F35] text-white flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold font-display leading-none">BuildFlow</div>
              <div className="text-[11px] text-slate-300 mt-0.5 truncate max-w-[160px]">{activeSite.name}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-5">
          {SITE_MANAGER_NAV.map((group) => (
            <div key={group.group}>
              <div className="px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const count = getBadge(item.badgeKey);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium',
                            isActive ? 'bg-[#2563EB] text-white' : 'text-slate-200 hover:bg-white/8'
                          )
                        }
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {count > 0 && (
                          <span className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-white/15">
                            {count}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};
