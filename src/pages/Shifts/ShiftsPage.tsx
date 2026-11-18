import React, { useState } from 'react';
import { Clock3, Info, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const ShiftsPage: React.FC = () => {
  const { activeSite, siteShifts } = useSiteContext();
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [shiftReason, setShiftReason] = useState('');
  const [requestedShift, setRequestedShift] = useState(siteShifts[0]?.name ?? 'General Shift');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftReason.trim()) return;
    toast.success(`Shift roster change request submitted for ${requestedShift} (Pending HR/Admin sync)`);
    setShiftReason('');
    setChangeModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Shift Management"
        description={`Active shift schedules and supervisor rosters for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Workforce', to: '/' }, { label: 'Shift Management' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setChangeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Request Roster Change
          </button>
        }
      />

      <div className="mb-5 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-start gap-2.5 text-xs text-blue-950">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <span>
          <strong>Overtime Policy Notice:</strong> Checking out after the scheduled shift end time does not automatically generate overtime pay. Overtime requires a formal pre-approved request in the Leave & Overtime module.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {siteShifts.map((shift) => (
          <div key={shift.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <StatusBadge label={shift.type} tone="info" />
                <h3 className="text-base font-bold text-[#172B4D] font-display mt-2">{shift.name}</h3>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono tabular-nums">
              <div>
                <div className="text-[11px] text-[#64748B] font-sans">Timings</div>
                <div className="font-semibold text-[#172B4D]">
                  {shift.startTime} – {shift.endTime}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#64748B] font-sans">Break</div>
                <div className="font-semibold text-[#172B4D]">{shift.breakMinutes} min</div>
              </div>
            </div>

            <div className="text-xs text-[#64748B] space-y-1">
              <div className="flex justify-between">
                <span>Assigned Workers</span>
                <strong className="text-[#172B4D] font-mono tabular-nums">{shift.assignedCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Shift Supervisor</span>
                <strong className="text-[#172B4D]">{shift.supervisorName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Effective Window</span>
                <span className="font-mono">{shift.effectiveFrom} → {shift.effectiveTo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={changeModalOpen}
        onClose={() => setChangeModalOpen(false)}
        title="Request Shift Roster Modification"
        subtitle={`Scoped to ${activeSite.name}`}
      >
        <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Target Shift</label>
            <select
              value={requestedShift}
              onChange={(e) => setRequestedShift(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              {siteShifts.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.startTime} – {s.endTime})
                </option>
              ))}
              <option value="Custom Concrete Pour Shift">New Custom Shift</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Operational Reason & Affected Crew</label>
            <textarea
              rows={3}
              value={shiftReason}
              onChange={(e) => setShiftReason(e.target.value)}
              placeholder="e.g., Move 12 masons to early 07:00 AM shift for curing schedule..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setChangeModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Submit Roster Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
