import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertOctagon, CheckCircle2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Drawer, Modal } from '../../components/common/Modal';
import { IncidentCategory, IncidentSeverity, SafetyIncident, SafetyInspection } from '../../types/domain';
import { cn } from '../../utils/format';

const INCIDENT_CATEGORIES: IncidentCategory[] = [
  'Injury',
  'Near Miss',
  'Unsafe Condition',
  'Equipment Incident',
  'Fire Hazard',
  'Electrical Hazard',
  'Structural Concern',
  'PPE Violation',
];

export const SafetyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeSite, siteIncidents, siteInspections, managerProfile } = useSiteContext();
  const reportSafetyIncident = useBuildFlowStore((s) => s.reportSafetyIncident);
  const updateIncidentStatus = useBuildFlowStore((s) => s.updateIncidentStatus);
  const toggleChecklistItem = useBuildFlowStore((s) => s.toggleChecklistItem);

  const [tab, setTab] = useState<'incidents' | 'inspections'>('incidents');
  const [reportOpen, setReportOpen] = useState(searchParams.get('action') === 'report');
  const [activeInspection, setActiveInspection] = useState<SafetyInspection | null>(null);

  const [category, setCategory] = useState<IncidentCategory>('Unsafe Condition');
  const [severity, setSeverity] = useState<IncidentSeverity>('High');
  const [workArea, setWorkArea] = useState(activeSite.geofence.zones[0]?.name ?? 'Tower A');
  const [description, setDescription] = useState('');
  const [peopleInvolved, setPeopleInvolved] = useState('');
  const [immediateAction, setImmediateAction] = useState('');

  const criticalOpen = siteIncidents.filter((i) => i.severity === 'Critical' && i.status !== 'Closed');

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !immediateAction.trim()) {
      toast.error('Description and immediate containment action are required.');
      return;
    }
    reportSafetyIncident({
      siteId: activeSite.id,
      dateTime: '2026-11-18 11:30 AM',
      workArea,
      category,
      severity,
      description: description.trim(),
      peopleInvolved: peopleInvolved.trim() || 'Site crew',
      injuryDetails: category === 'Injury' ? 'First aid / medical check initiated' : 'No injury',
      immediateAction: immediateAction.trim(),
      reportedBy: managerProfile.name,
      assignedSafetyOfficer: 'K. Raghava (Safety Officer)',
    });
    toast.success(
      severity === 'Critical'
        ? 'CRITICAL incident logged and escalated immediately to Company Admin & Safety Head'
        : 'Safety incident logged and assigned to Safety Officer'
    );
    setDescription('');
    setPeopleInvolved('');
    setImmediateAction('');
    setReportOpen(false);
  };

  // Sync active inspection from store when checklist toggled
  const liveInspection = activeInspection
    ? siteInspections.find((ins) => ins.id === activeInspection.id) ?? activeInspection
    : null;

  return (
    <div>
      <PageHeader
        title="Safety & Incidents"
        description={`First-class EHS incident logging, emergency escalations, and inspection checklists for ${activeSite.name}. Incident logs cannot be deleted.`}
        breadcrumbs={[{ label: 'Site Management', to: '/' }, { label: 'Safety & Incidents' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] text-white hover:bg-red-700"
          >
            <ShieldAlert className="w-4 h-4" />
            Report Safety Incident
          </button>
        }
      />

      {criticalOpen.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-950">
          <AlertOctagon className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">
              {criticalOpen.length} Critical Safety Incident Escalated
            </div>
            <p className="mt-0.5">
              {criticalOpen[0].incidentCode} ({criticalOpen[0].workArea}): {criticalOpen[0].description} — Emergency protocol active and Company Admin notified.
            </p>
          </div>
        </div>
      )}

      {/* Safety Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Open Incidents</div>
          <div className="text-2xl font-bold text-[#DC2626] font-display tabular-nums mt-1">
            {siteIncidents.filter((i) => i.status === 'Open' || i.status === 'Corrective Action Assigned').length}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Critical Escalations</div>
          <div className="text-2xl font-bold text-[#172B4D] font-display tabular-nums mt-1">{criticalOpen.length}</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Pending Inspections</div>
          <div className="text-2xl font-bold text-[#D97706] font-display tabular-nums mt-1">
            {siteInspections.filter((ins) => ins.status !== 'Completed').length}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Resolved / Closed</div>
          <div className="text-2xl font-bold text-[#16A34A] font-display tabular-nums mt-1">
            {siteIncidents.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 bg-slate-200/70 rounded-lg mb-5">
        <button
          type="button"
          onClick={() => setTab('incidents')}
          className={cn(
            'px-3.5 py-1.5 rounded-md text-xs font-semibold',
            tab === 'incidents' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
          )}
        >
          Safety Incidents ({siteIncidents.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('inspections')}
          className={cn(
            'px-3.5 py-1.5 rounded-md text-xs font-semibold',
            tab === 'inspections' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
          )}
        >
          Site Inspections ({siteInspections.length})
        </button>
      </div>

      {tab === 'incidents' ? (
        <div className="space-y-3">
          {siteIncidents.map((inc) => (
            <div key={inc.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-mono font-bold text-[#172B4D]">{inc.incidentCode}</span>
                  <StatusBadge label={inc.severity} />
                  <StatusBadge label={inc.category} tone="neutral" />
                  <StatusBadge label={inc.status} />
                  {inc.escalatedToAdmin && <StatusBadge label="Admin Escalated" tone="danger" />}
                </div>
                <select
                  value={inc.status}
                  onChange={(e) => {
                    updateIncidentStatus(inc.id, e.target.value as SafetyIncident['status']);
                    toast.success(`Updated ${inc.incidentCode} status (history preserved)`);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg self-start"
                >
                  <option value="Open">Open</option>
                  <option value="Corrective Action Assigned">Corrective Action Assigned</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <p className="text-sm font-semibold text-[#172B4D]">{inc.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F5F7FA] p-3 rounded-lg border border-[#E2E8F0]">
                <div>
                  <strong>Immediate Action Taken:</strong> {inc.immediateAction}
                </div>
                <div>
                  <strong>Work Area & Officer:</strong> {inc.workArea} · {inc.assignedSafetyOfficer}
                </div>
              </div>

              <div className="text-[11px] text-[#64748B]">
                Reported by {inc.reportedBy} at <span className="font-mono">{inc.dateTime}</span> · People involved: {inc.peopleInvolved}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {siteInspections.map((ins) => {
            const passedCount = ins.checklist.filter((c) => c.passed === true).length;
            return (
              <div key={ins.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <StatusBadge label={ins.status} />
                    <h3 className="text-sm font-bold text-[#172B4D] font-display mt-2">{ins.title}</h3>
                  </div>
                  <ClipboardCheck className="w-5 h-5 text-[#2563EB] shrink-0" />
                </div>
                <div className="text-xs text-[#64748B]">
                  {ins.workArea} · Inspector: {ins.inspectorName} · Date: <span className="font-mono">{ins.scheduledDate}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
                  <span className="font-mono text-[#172B4D]">
                    {passedCount} / {ins.checklist.length} checks passed
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveInspection(ins)}
                    className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-semibold hover:bg-blue-100"
                  >
                    Open Checklist
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Incident Modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report Site Safety Incident"
        subtitle="Critical incidents automatically escalate to Company Admin & Safety Head"
      >
        <form onSubmit={handleReportSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Escalate)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Work Area</label>
              <select
                value={workArea}
                onChange={(e) => setWorkArea(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {activeSite.geofence.zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Incident Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Immediate Containment Action Taken</label>
            <textarea
              rows={2}
              value={immediateAction}
              onChange={(e) => setImmediateAction(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">People Involved</label>
            <input
              value={peopleInvolved}
              onChange={(e) => setPeopleInvolved(e.target.value)}
              placeholder="e.g., Tower A Formwork Crew"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setReportOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#DC2626] text-white font-semibold">
              Submit Incident Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspection Checklist Drawer */}
      <Drawer
        open={Boolean(liveInspection)}
        onClose={() => setActiveInspection(null)}
        title={liveInspection?.title ?? ''}
        subtitle={liveInspection ? `${liveInspection.workArea} · ${liveInspection.inspectorName}` : ''}
      >
        {liveInspection && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span>Checklist Status</span>
              <StatusBadge label={liveInspection.status} />
            </div>
            {liveInspection.checklist.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl border border-[#E2E8F0] space-y-2.5">
                <div className="font-medium text-[#172B4D]">{item.item}</div>
                {item.note && <div className="text-[11px] text-[#64748B]">Note: {item.note}</div>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(liveInspection.id, item.id, true)}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-semibold border inline-flex items-center gap-1',
                      item.passed === true
                        ? 'bg-[#16A34A] text-white border-[#16A34A]'
                        : 'bg-white text-[#172B4D] border-[#E2E8F0]'
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(liveInspection.id, item.id, false)}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-semibold border',
                      item.passed === false
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : 'bg-white text-[#172B4D] border-[#E2E8F0]'
                    )}
                  >
                    Fail / Action Req
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};
