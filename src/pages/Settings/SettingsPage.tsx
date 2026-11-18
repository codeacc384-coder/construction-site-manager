import React, { useState } from 'react';
import { Check, Lock, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RESTRICTED_ADMIN_ACTIONS } from '../../utils/permissions';

export const SettingsPage: React.FC = () => {
  const { activeSite, managerProfile, can } = useSiteContext();
  const updateSiteSettings = useBuildFlowStore((s) => s.updateSiteSettings);
  const resetDemoState = useBuildFlowStore((s) => s.resetDemoState);

  const [emergencyContact, setEmergencyContact] = useState(activeSite.emergencyContact);
  const [shiftStart, setShiftStart] = useState(activeSite.defaultShiftStart);
  const [shiftEnd, setShiftEnd] = useState(activeSite.defaultShiftEnd);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('canEditSiteSettings')) {
      toast.error('Site settings editing is restricted by Company Admin.');
      return;
    }
    updateSiteSettings(activeSite.id, {
      emergencyContact,
      defaultShiftStart: shiftStart,
      defaultShiftEnd: shiftEnd,
    });
    toast.success(`Updated operational settings for ${activeSite.name}`);
  };

  return (
    <div>
      <PageHeader
        title="Site Settings & Access Scope"
        description={`Permitted site-level operational settings for ${activeSite.name}. Organization-wide RBAC and billing remain under Company Admin.`}
        breadcrumbs={[{ label: 'Account', to: '/' }, { label: 'Site Settings' }]}
        secondaryActions={
          <button
            type="button"
            onClick={() => {
              resetDemoState();
              toast.success('Prototype state reset to initial site dataset');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D] font-display">Site Operational Parameters</h2>
              <p className="text-[#64748B]">Code: <span className="font-mono">{activeSite.code}</span> · {activeSite.location}</p>
            </div>
            <StatusBadge label={activeSite.operatingStatus} />
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Site Name (Read-Only)</label>
            <input value={activeSite.name} disabled className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F5F7FA] text-[#64748B]" />
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Site Address</label>
            <input value={activeSite.address} disabled className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F5F7FA] text-[#64748B]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Geofence Perimeter (Admin Controlled)</label>
              <input
                value={`${activeSite.geofence.radiusMeters}m radius (${activeSite.geofence.polygonLabel})`}
                disabled
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F5F7FA] text-[#64748B] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Working Days</label>
              <input
                value={activeSite.workingDays.join(', ')}
                disabled
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F5F7FA] text-[#64748B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Shift Start</label>
              <input
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Shift End</label>
              <input
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Emergency Contact</label>
              <input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700"
            >
              <Save className="w-3.5 h-3.5" />
              Save Permitted Settings
            </button>
          </div>
        </form>

        {/* RBAC Scope Overview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#172B4D] font-display">Active Site Manager Permissions</h2>
            <div className="space-y-2">
              {Object.entries(managerProfile.permissions).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-[#E2E8F0] last:border-0">
                  <span className="text-[#172B4D] font-mono text-[11px]">{key}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <Check className="w-3.5 h-3.5" /> {enabled ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2.5 text-xs">
            <h2 className="text-sm font-bold text-[#172B4D] font-display flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#DC2626]" />
              Restricted to Company Admin / Finance
            </h2>
            <ul className="space-y-1.5 text-[#64748B] list-disc pl-4">
              {RESTRICTED_ADMIN_ACTIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
