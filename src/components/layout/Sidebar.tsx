import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
} from 'lucide-react';
import { SITE_MANAGER_NAV } from './navigation';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { cn, getInitials } from '../../utils/format';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMultiSite: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onOpenMultiSite,
}) => {
  const {
    activeSite,
    sites,
    managerProfile,
    can,
    pendingApprovalCount,
    openSafetyCount,
    unreadNotificationsCount,
  } = useSiteContext();
  const setActiveSiteId = useBuildFlowStore((s) => s.setActiveSiteId);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const getBadgeCount = (key?: 'approvals' | 'notifications' | 'safety'): number => {
    if (key === 'approvals') return pendingApprovalCount;
    if (key === 'notifications') return unreadNotificationsCount;
    if (key === 'safety') return openSafetyCount;
    return 0;
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-[#101F35] text-white border-r border-[#1E3354] shrink-0 transition-all duration-200 h-screen sticky top-0 z-30',
        collapsed ? 'w-[76px]' : 'w-[268px]'
      )}
    >
      {/* Brand Row */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 min-w-0 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-white font-display leading-none whitespace-nowrap">
                BuildFlow
              </div>
              <div className="text-[11px] text-slate-300/80 mt-0.5 whitespace-nowrap">
                Site Operations
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Site Selector */}
      {!collapsed && (
        <div className="p-3 border-b border-white/10 relative shrink-0">
          <button
            type="button"
            onClick={() => setSiteDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#182D4C] hover:bg-[#1E375B] border border-white/10 text-left transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-amber-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{activeSite.location} · {activeSite.code}</span>
              </div>
              <div className="text-xs font-semibold text-white truncate mt-0.5">
                {activeSite.name}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-300 shrink-0 transition-transform',
                siteDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {siteDropdownOpen && (
            <div className="absolute left-3 right-3 top-[74px] z-50 bg-[#0D1A2D] border border-white/15 rounded-lg shadow-2xl py-1.5 overflow-hidden">
              {sites.map((site) => {
                const selected = site.id === activeSite.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      setActiveSiteId(site.id);
                      setSiteDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left flex items-start justify-between gap-2 transition-colors',
                      selected ? 'bg-[#2563EB]/25 text-white' : 'text-slate-200 hover:bg-white/5'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{site.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {site.location} · {site.overallProgress}% progress
                      </div>
                    </div>
                    {selected && (
                      <span className="text-[10px] font-semibold text-blue-300 shrink-0 mt-0.5">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}

              {can('canViewMultiSiteOverview') && (
                <div className="mt-1 pt-1 border-t border-white/10 px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSiteDropdownOpen(false);
                      onOpenMultiSite();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-amber-300 hover:bg-white/5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>All Assigned Sites ({sites.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2.5 space-y-5">
        {SITE_MANAGER_NAV.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const count = getBadgeCount(item.badgeKey);
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap',
                          isActive
                            ? 'bg-[#2563EB] text-white shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-white/8'
                        )
                      }
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 opacity-90" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </span>
                      {!collapsed && count > 0 && (
                        <span className="px-1.5 py-0.5 text-[11px] font-mono tabular-nums rounded bg-white/15 text-white shrink-0">
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

      {/* Bottom Profile Card */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {getInitials(managerProfile.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{managerProfile.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{managerProfile.designation}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
