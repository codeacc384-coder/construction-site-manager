import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronDown,
  HelpCircle,
  MapPin,
  Menu,
  Search,
  UserCircle2,
  Layers,
} from 'lucide-react';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { cn, getInitials } from '../../utils/format';

interface TopNavProps {
  onOpenMultiSite: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMultiSite }) => {
  const {
    activeSite,
    sites,
    managerProfile,
    can,
    siteNotifications,
    unreadNotificationsCount,
  } = useSiteContext();

  const setActiveSiteId = useBuildFlowStore((s) => s.setActiveSiteId);
  const globalSearch = useBuildFlowStore((s) => s.globalSearch);
  const setGlobalSearch = useBuildFlowStore((s) => s.setGlobalSearch);
  const setMobileDrawerOpen = useBuildFlowStore((s) => s.setMobileDrawerOpen);
  const markNotificationRead = useBuildFlowStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useBuildFlowStore((s) => s.markAllNotificationsRead);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSiteMenuOpen, setMobileSiteMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim().toLowerCase();
    if (!q) return;
    if (q.includes('cement') || q.includes('steel') || q.includes('brick') || q.includes('stock')) {
      navigate('/inventory');
    } else if (q.includes('crane') || q.includes('mixer') || q.includes('excavator') || q.includes('equip')) {
      navigate('/equipment');
    } else if (q.includes('safe') || q.includes('hazard') || q.includes('incident')) {
      navigate('/safety');
    } else if (q.includes('attend') || q.includes('gps') || q.includes('track')) {
      navigate('/attendance');
    } else if (q.includes('pr-') || q.includes('purch') || q.includes('procur')) {
      navigate('/procurement');
    } else {
      navigate('/workforce');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] shrink-0">
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile drawer button + Active Site Context */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-1 rounded-lg text-[#172B4D] hover:bg-slate-100 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop site breadcrumb info */}
          <div className="hidden lg:flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] truncate">
                <span className="truncate">{activeSite.name}</span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-xs font-medium text-[#64748B] flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                  {activeSite.location}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span className="font-mono">{activeSite.code}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  18 Nov 2026
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">{activeSite.operatingStatus}</span>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Compact Site Selector */}
          <div className="lg:hidden relative min-w-0">
            <button
              type="button"
              onClick={() => setMobileSiteMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] text-left max-w-[210px] sm:max-w-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#172B4D] truncate">{activeSite.name}</div>
                <div className="text-[10px] text-[#64748B] truncate">{activeSite.location} · 18 Nov</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            </button>

            {mobileSiteMenuOpen && (
              <div className="absolute left-0 top-12 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1.5 z-50">
                {sites.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveSiteId(s.id);
                      setMobileSiteMenuOpen(false);
                    }}
                    className={cn(
                      'w-full px-3.5 py-2.5 text-left hover:bg-[#F5F7FA] flex items-center justify-between gap-2',
                      s.id === activeSite.id && 'bg-[#EFF6FF]'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#172B4D] truncate">{s.name}</div>
                      <div className="text-[11px] text-[#64748B]">{s.location} · {s.overallProgress}%</div>
                    </div>
                    {s.id === activeSite.id && (
                      <span className="text-[11px] font-semibold text-[#2563EB]">Active</span>
                    )}
                  </button>
                ))}
                {can('canViewMultiSiteOverview') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSiteMenuOpen(false);
                      onOpenMultiSite();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#2563EB] border-t border-[#E2E8F0] flex items-center gap-1.5 hover:bg-[#F5F7FA]"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    All Assigned Sites Summary
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search + Notifications + Help + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search site workers, materials, PO..."
              className="w-60 xl:w-72 pl-9 pr-3 py-1.5 text-xs bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#172B4D] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </form>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F5F7FA] transition-colors"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded bg-[#DC2626] text-white text-[10px] font-mono font-semibold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#172B4D]">
                    Site Alerts ({activeSite.location})
                  </span>
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead(activeSite.id)}
                    className="text-xs font-medium text-[#2563EB] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {siteNotifications.length === 0 ? (
                    <div className="p-4 text-xs text-[#64748B] text-center">No notifications for this site.</div>
                  ) : (
                    siteNotifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          navigate(n.targetRoute);
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-[#F5F7FA] transition-colors',
                          !n.read && 'bg-[#EFF6FF]/60'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#172B4D] truncate">{n.title}</span>
                          <span className="text-[11px] text-[#64748B] font-mono shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F5F7FA] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/notifications');
                    }}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    View all site notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/support')}
            aria-label="Help and support"
            className="hidden sm:inline-flex p-2 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F5F7FA] transition-colors"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-[#F5F7FA] transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[#101F35] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {getInitials(managerProfile.name)}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-[#172B4D] whitespace-nowrap">
                {managerProfile.name}
              </span>
              <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-[#64748B]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-[#E2E8F0]">
                  <div className="text-xs font-semibold text-[#172B4D]">{managerProfile.name}</div>
                  <div className="text-[11px] text-[#64748B]">{managerProfile.designation} · {managerProfile.empCode}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#172B4D] hover:bg-[#F5F7FA] flex items-center gap-2"
                >
                  <UserCircle2 className="w-3.5 h-3.5 text-[#64748B]" />
                  My Profile & Limits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#172B4D] hover:bg-[#F5F7FA]"
                >
                  Site Settings & Access Scope
                </button>
                {can('canViewMultiSiteOverview') && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenMultiSite();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#2563EB] font-medium hover:bg-[#F5F7FA] border-t border-[#E2E8F0]"
                  >
                    All Assigned Sites Overview
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
