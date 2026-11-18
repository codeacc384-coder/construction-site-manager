import React, { useMemo, useState } from 'react';
import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Drawer, Modal } from '../../components/common/Modal';
import { EquipmentAsset, EquipmentStatus } from '../../types/domain';
import { cn } from '../../utils/format';

export const EquipmentPage: React.FC = () => {
  const { activeSite, siteEquipment } = useSiteContext();
  const updateEquipmentStatus = useBuildFlowStore((s) => s.updateEquipmentStatus);
  const logEquipmentUsage = useBuildFlowStore((s) => s.logEquipmentUsage);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEq, setSelectedEq] = useState<EquipmentAsset | null>(null);
  const [actionTarget, setActionTarget] = useState<EquipmentAsset | null>(null);
  const [nextStatus, setNextStatus] = useState<EquipmentStatus>('Under Maintenance');
  const [logNote, setLogNote] = useState('');
  const [usageHours, setUsageHours] = useState('4');

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return siteEquipment;
    return siteEquipment.filter((e) => e.status === statusFilter);
  }, [siteEquipment, statusFilter]);

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget) return;
    updateEquipmentStatus(
      actionTarget.id,
      nextStatus,
      logNote.trim() || `Status updated to ${nextStatus}`,
      nextStatus === 'Under Maintenance' ? 'Breakdown / Maintenance Request' : 'Status Change'
    );
    toast.success(`${actionTarget.assetCode} updated to ${nextStatus}`);
    setActionTarget(null);
    setLogNote('');
  };

  return (
    <div>
      <PageHeader
        title="Equipment & Machinery"
        description={`Track site machinery availability, operator assignments, hours logged, and maintenance tickets on ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Materials & Assets', to: '/' }, { label: 'Equipment & Machinery' }]}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'In Use', 'Available', 'Under Maintenance', 'Out of Service'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0]'
                )}
              >
                {st === 'ALL' ? `All (${siteEquipment.length})` : st}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((eq) => (
          <div key={eq.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-[#64748B]">{eq.assetCode} · {eq.category}</span>
                  <h3 className="text-sm font-bold text-[#172B4D] font-display mt-0.5">{eq.name}</h3>
                </div>
                <StatusBadge label={eq.status} />
              </div>

              <div className="text-xs text-[#64748B] space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Assigned Operator</span>
                  <strong className="text-[#172B4D]">{eq.assignedOperator}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Work Area</span>
                  <strong className="text-[#172B4D]">{eq.workArea}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hours Logged (Month)</span>
                  <strong className="font-mono text-[#172B4D] tabular-nums">{eq.hoursLoggedMonth} hrs</strong>
                </div>
                <div className="flex justify-between">
                  <span>Next Service Due</span>
                  <span className="font-mono text-[#172B4D]">{eq.nextMaintenanceDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedEq(eq)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
              >
                Logs & History
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionTarget(eq);
                  setNextStatus(eq.status === 'In Use' ? 'Under Maintenance' : 'In Use');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100"
              >
                <Wrench className="w-3.5 h-3.5" />
                Maintenance / Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Detail Drawer */}
      <Drawer
        open={Boolean(selectedEq)}
        onClose={() => setSelectedEq(null)}
        title={selectedEq?.name ?? ''}
        subtitle={selectedEq ? `${selectedEq.assetCode} · ${selectedEq.category} · ${selectedEq.fuelType}` : ''}
      >
        {selectedEq && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-[#64748B]">Log Daily Operating Hours</div>
                <div className="font-mono font-bold text-sm text-[#172B4D]">
                  Total this month: {selectedEq.hoursLoggedMonth} hrs
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={usageHours}
                  onChange={(e) => setUsageHours(e.target.value)}
                  className="w-16 px-2 py-1.5 border border-[#E2E8F0] rounded-lg bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const hrs = Number(usageHours);
                    if (hrs > 0) {
                      logEquipmentUsage(selectedEq.id, hrs);
                      toast.success(`Added ${hrs} operating hours to ${selectedEq.assetCode}`);
                      setSelectedEq(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" /> Log
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#172B4D] mb-2">Site Assignment History (Preserved)</h4>
              <div className="space-y-2">
                {selectedEq.assignmentHistory.map((h, i) => (
                  <div key={i} className="p-3 border border-[#E2E8F0] rounded-lg">
                    <div className="font-semibold text-[#172B4D]">{h.siteName}</div>
                    <div className="text-[#64748B]">
                      Operator: {h.operator} · <span className="font-mono">{h.from} → {h.to ?? 'Present'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#172B4D] mb-2">Maintenance & Breakdown History</h4>
              {selectedEq.maintenanceLogs.length === 0 ? (
                <div className="p-4 border border-[#E2E8F0] rounded-lg text-[#64748B]">No maintenance issues logged yet.</div>
              ) : (
                <div className="space-y-2">
                  {selectedEq.maintenanceLogs.map((m, i) => (
                    <div key={i} className="p-3 border border-[#E2E8F0] rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#172B4D]">{m.type}</span>
                        <span className="font-mono text-[#64748B]">{m.date}</span>
                      </div>
                      <p className="text-[#64748B]">{m.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Maintenance / Breakdown Modal */}
      <Modal
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        title={`Update Asset Status — ${actionTarget?.assetCode ?? ''}`}
        subtitle={actionTarget?.name}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">New Operational Status</label>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as EquipmentStatus)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Under Maintenance">Under Maintenance (Report Breakdown)</option>
              <option value="Out of Service">Out of Service</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Breakdown / Maintenance Notes</label>
            <textarea
              rows={3}
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="Describe issue, spare requirement, or return-to-service check..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActionTarget(null)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Save Asset Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
