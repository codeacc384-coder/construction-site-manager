import React, { useState } from 'react';
import { Briefcase, Lock, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const ContractorsPage: React.FC = () => {
  const { activeSite, siteContractors } = useSiteContext();
  const forwardContractorBill = useBuildFlowStore((s) => s.forwardContractorBill);

  const [issueTarget, setIssueTarget] = useState<string | null>(null);
  const [issueNote, setIssueNote] = useState('');

  const handleLogIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueNote.trim()) return;
    toast.success(`Contractor performance issue logged for ${issueTarget}`);
    setIssueTarget(null);
    setIssueNote('');
  };

  return (
    <div>
      <PageHeader
        title="Contractors & Subcontractors"
        description={`Monitor assigned subcontractor teams, statutory compliance, and work completion on ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Materials & Assets', to: '/' }, { label: 'Contractors' }]}
      />

      <div className="mb-5 p-3.5 rounded-xl bg-slate-100 border border-[#E2E8F0] flex items-center gap-2.5 text-xs text-[#64748B]">
        <Lock className="w-4 h-4 text-[#172B4D] shrink-0" />
        <span>
          Contractor labour records remain segregated from direct company payroll. Confidential commercial contract rates and settlement ledgers are restricted to Company Finance & Admin.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {siteContractors.map((con) => (
          <div key={con.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge label={con.workStatus} />
                  <StatusBadge label={con.complianceStatus} />
                </div>
                <h3 className="text-base font-bold text-[#172B4D] font-display flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2563EB] shrink-0" />
                  {con.companyName}
                </h3>
                <div className="text-xs text-[#64748B]">{con.workCategory}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold font-mono text-[#172B4D] tabular-nums">{con.completionPct}%</div>
                <div className="text-[11px] text-[#64748B]">Work Progress</div>
              </div>
            </div>

            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${con.completionPct}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] text-xs">
              <div>
                <div className="text-[#64748B]">Contact Person</div>
                <div className="font-semibold text-[#172B4D]">{con.contactPerson}</div>
                <div className="font-mono text-[11px] text-[#64748B]">{con.phone}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Contractor Attendance</div>
                <div className="font-mono font-bold text-[#172B4D] tabular-nums">
                  {con.presentToday} / {con.workforceCount} Present
                </div>
                <div className="text-[11px] text-[#64748B]">Sup: {con.assignedSupervisor}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
              <div className="text-[#64748B]">
                RA Bill Status: <strong className="text-[#172B4D]">{con.latestBillStatus}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIssueTarget(con.companyName)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA] font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  Record Issue
                </button>
                {con.latestBillStatus !== 'Forwarded to Finance' && (
                  <button
                    type="button"
                    onClick={() => {
                      forwardContractorBill(con.id);
                      toast.success(`Forwarded verified measurement sheet for ${con.companyName} to Finance`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Forward Bill
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(issueTarget)}
        onClose={() => setIssueTarget(null)}
        title={`Record Contractor Issue — ${issueTarget ?? ''}`}
        subtitle="Creates an auditable site non-conformance or schedule notice"
      >
        <form onSubmit={handleLogIssue} className="space-y-3.5 text-xs">
          <textarea
            rows={3}
            value={issueNote}
            onChange={(e) => setIssueNote(e.target.value)}
            placeholder="Describe workmanship issue, manpower shortfall, or PF/ESIC compliance gap..."
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIssueTarget(null)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Log Site Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
