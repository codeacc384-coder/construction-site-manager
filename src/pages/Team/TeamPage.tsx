import React, { useMemo, useState } from 'react';
import { HardHat, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Drawer, Modal } from '../../components/common/Modal';
import { Employee } from '../../types/domain';
import { getInitials } from '../../utils/format';

export const TeamPage: React.FC = () => {
  const { activeSite, siteEmployees, siteTasks, siteDailyReports } = useSiteContext();
  const createTask = useBuildFlowStore((s) => s.createTask);

  const [selectedLead, setSelectedLead] = useState<Employee | null>(null);
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [delegateTarget, setDelegateTarget] = useState<Employee | null>(null);
  const [delegateType, setDelegateType] = useState('Assign Work Area');
  const [delegateArea, setDelegateArea] = useState(activeSite.geofence.zones[0]?.name ?? '');
  const [delegateNote, setDelegateNote] = useState('');

  const operationalTeam = useMemo(
    () => siteEmployees.filter((e) => ['Site Engineer', 'Supervisor', 'Foreman'].includes(e.designation)),
    [siteEmployees]
  );

  const handleDelegateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateTarget) return;
    createTask({
      siteId: activeSite.id,
      title: `${delegateType}: ${delegateArea}`,
      description: delegateNote.trim() || `Delegated ${delegateType} responsibility to ${delegateTarget.name}.`,
      workArea: delegateArea,
      assignedToId: delegateTarget.id,
      assignedToName: delegateTarget.name,
      assignedRole: delegateTarget.designation,
      priority: 'High',
      status: 'Assigned',
      startDate: '2026-11-18',
      dueDate: '2026-11-19',
      progressPct: 15,
    });
    toast.success(`${delegateType} assigned to ${delegateTarget.name}`);
    setDelegateModalOpen(false);
    setDelegateNote('');
  };

  return (
    <div>
      <PageHeader
        title="Supervisors & Site Engineers"
        description={`Manage operational leadership, work area delegation, and daily reporting accountability on ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Workforce', to: '/' }, { label: 'Supervisors & Engineers' }]}
      />

      <div className="mb-5 p-3.5 rounded-xl bg-slate-100 border border-[#E2E8F0] flex items-center gap-2.5 text-xs text-[#64748B]">
        <ShieldAlert className="w-4 h-4 text-[#172B4D] shrink-0" />
        <span>
          Site Managers can delegate work areas, muster verification, and daily tasks, but cannot alter company-wide job designations or unrestricted user permissions.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {operationalTeam.map((member) => {
          const memberTasks = siteTasks.filter((t) => t.assignedToId === member.id);
          const managedWorkers = siteEmployees.filter((e) => e.supervisorId === member.id).length;
          const reportsCount = siteDailyReports.filter((r) => r.submittedBy.includes(member.name)).length;

          return (
            <div key={member.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#172B4D] font-display truncate">{member.name}</h3>
                      <div className="text-xs text-[#64748B]">
                        {member.designation} · <span className="font-mono">{member.empCode}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge label={member.attendanceStatus} />
                </div>

                <div className="text-xs text-[#64748B] space-y-1">
                  <div>
                    Work Area: <strong className="text-[#172B4D]">{member.workArea}</strong>
                  </div>
                  <div>
                    Department: <strong className="text-[#172B4D]">{member.department}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0] text-center text-xs tabular-nums">
                  <div>
                    <div className="font-bold text-[#172B4D] font-mono">{managedWorkers}</div>
                    <div className="text-[11px] text-[#64748B]">Crew</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#2563EB] font-mono">{memberTasks.length}</div>
                    <div className="text-[11px] text-[#64748B]">Tasks</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#16A34A] font-mono">{reportsCount}</div>
                    <div className="text-[11px] text-[#64748B]">Diaries</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(member)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDelegateTarget(member);
                    setDelegateArea(member.workArea);
                    setDelegateModalOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
                >
                  <Send className="w-3.5 h-3.5" />
                  Delegate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Member Profile Drawer */}
      <Drawer
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name ?? ''}
        subtitle={selectedLead ? `${selectedLead.designation} · ${selectedLead.workArea}` : ''}
      >
        {selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] space-y-1.5">
              <div><strong>Email:</strong> {selectedLead.email ?? '—'}</div>
              <div><strong>Phone:</strong> {selectedLead.phone ?? 'Restricted'}</div>
              <div><strong>Shift:</strong> {selectedLead.shiftName}</div>
            </div>
            <div>
              <h4 className="font-bold text-[#172B4D] mb-2 flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-[#2563EB]" />
                Assigned Tasks
              </h4>
              <div className="space-y-2">
                {siteTasks.filter((t) => t.assignedToId === selectedLead.id).map((t) => (
                  <div key={t.id} className="p-3 border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-2">
                    <span className="font-medium text-[#172B4D]">{t.title}</span>
                    <StatusBadge label={t.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delegation Modal */}
      <Modal
        open={delegateModalOpen}
        onClose={() => setDelegateModalOpen(false)}
        title={`Delegate Operational Action — ${delegateTarget?.name ?? ''}`}
        subtitle="Assigns operational responsibility on this site without modifying global RBAC roles"
      >
        <form onSubmit={handleDelegateSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Delegation Type</label>
            <select
              value={delegateType}
              onChange={(e) => setDelegateType(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="Assign Work Area">Assign Work Area</option>
              <option value="Delegate Attendance Verification">Delegate Attendance Verification</option>
              <option value="Request Progress Update">Request Progress Update</option>
              <option value="Allocate Additional Crew">Allocate Additional Crew</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Target Work Area</label>
            <select
              value={delegateArea}
              onChange={(e) => setDelegateArea(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              {activeSite.geofence.zones.map((z) => (
                <option key={z.id} value={z.name}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Instructions</label>
            <textarea
              rows={3}
              value={delegateNote}
              onChange={(e) => setDelegateNote(e.target.value)}
              placeholder="Specify scope, muster crew count, or report deadline..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDelegateModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Confirm Delegation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
