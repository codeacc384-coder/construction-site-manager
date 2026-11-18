import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileBottomNav, MobileNavDrawer } from './MobileBottomNav';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { MapPin, ArrowRight } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [multiSiteOpen, setMultiSiteOpen] = useState(false);

  const { sites, activeSite } = useSiteContext();
  const setActiveSiteId = useBuildFlowStore((s) => s.setActiveSiteId);

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-[#172B4D]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onOpenMultiSite={() => setMultiSiteOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onOpenMultiSite={() => setMultiSiteOpen(true)} />

        <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 lg:pb-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
      <MobileNavDrawer />

      {/* All Assigned Sites Overview Modal (Multi-Site Permitted Managers) */}
      <Modal
        open={multiSiteOpen}
        onClose={() => setMultiSiteOpen(false)}
        title="All Assigned Construction Sites"
        subtitle="Authorized site portfolio scoped to Rajesh Sharma (BF-SM-104). Individual site records stay strictly isolated."
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-3">
          {sites.map((site) => {
            const isCurrent = site.id === activeSite.id;
            return (
              <div
                key={site.id}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-[#64748B]">{site.code}</span>
                    <span className="text-slate-300">·</span>
                    <StatusBadge label={site.operatingStatus} />
                    {isCurrent && <StatusBadge label="Current Workspace" tone="info" />}
                  </div>
                  <h3 className="text-sm font-bold text-[#172B4D] font-display">{site.name}</h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{site.address}</span>
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-[#172B4D] tabular-nums">
                    <span>
                      Present: <strong>{site.workforceStats.present}</strong> / {site.workforceStats.assigned}
                    </span>
                    <span>
                      Progress: <strong>{site.overallProgress}%</strong> (Plan {site.plannedProgress}%)
                    </span>
                    <span>
                      Active Tracking: <strong>{site.workforceStats.activeTracking}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSiteId(site.id);
                    setMultiSiteOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shrink-0"
                >
                  <span>{isCurrent ? 'Selected' : 'Switch to Site'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
