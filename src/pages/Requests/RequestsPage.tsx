import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LeaveRequest, OvertimeRequest } from '../../types/domain';
import { cn } from '../../utils/format';

export const RequestsPage: React.FC = () => {
  const { activeSite, siteLeaveRequests, siteOvertimeRequests, managerProfile } = useSiteContext();
  const reviewLeaveRequest = useBuildFlowStore((s) => s.reviewLeaveRequest);
  const reviewOvertimeRequest = useBuildFlowStore((s) => s.reviewOvertimeRequest);

  const [tab, setTab] = useState<'leave' | 'overtime'>('leave');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedOt, setSelectedOt] = useState<OvertimeRequest | null>(null);
  const [remark, setRemark] = useState('');

  const handleLeaveDecision = (decision: 'Approved' | 'Rejected' | 'Clarification Requested') => {
    if (!selectedLeave) return;
    if (!remark.trim()) {
      toast.error('Please enter a decision remark.');
      return;
    }
    reviewLeaveRequest(selectedLeave.id, decision, remark.trim());
    toast.success(`Leave request ${decision.toLowerCase()} for ${selectedLeave.employeeName}`);
    setSelectedLeave(null);
    setRemark('');
  };

  const handleOtDecision = (decision: 'Approved' | 'Rejected' | 'Escalated to Admin') => {
    if (!selectedOt) return;
    if (!remark.trim()) {
      toast.error('Please enter a remark for the overtime audit log.');
      return;
    }
    reviewOvertimeRequest(selectedOt.id, decision, remark.trim());
    toast.success(`Overtime request marked: ${decision}`);
    setSelectedOt(null);
    setRemark('');
  };

  return (
    <div>
      <PageHeader
        title="Leave & Overtime Requests"
        description={`Review site-scoped leave impacts and pre-authorized overtime requests for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Workforce', to: '/' }, { label: 'Leave & Overtime' }]}
      />

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('leave')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold',
              tab === 'leave' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            Leave Requests ({siteLeaveRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('overtime')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold',
              tab === 'overtime' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            Overtime Requests ({siteOvertimeRequests.length})
          </button>
        </div>

        <div className="text-xs text-[#64748B] font-mono">
          Delegated OT Authority: Max {managerProfile.delegatedLimits.overtimeMaxHoursPerWeek} hrs/week (≤4 hrs/day)
        </div>
      </div>

      {tab === 'leave' && (
        <div className="space-y-3">
          {siteLeaveRequests.map((lr) => (
            <div key={lr.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#172B4D]">{lr.employeeName}</span>
                    <span className="text-xs text-[#64748B]">· {lr.designation}</span>
                    <StatusBadge label={lr.leaveType} tone="info" />
                    <StatusBadge label={lr.status} />
                  </div>
                  <div className="text-xs text-[#64748B] font-mono mt-1">
                    {lr.startDate} to {lr.endDate} ({lr.days} {lr.days === 1 ? 'day' : 'days'})
                  </div>
                </div>
                {lr.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeave(lr);
                      setRemark('');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white shrink-0"
                  >
                    Review Leave
                  </button>
                )}
              </div>
              <div className="text-xs text-[#172B4D]">
                <strong>Reason:</strong> {lr.reason}
              </div>
              <div className="text-xs text-[#64748B] bg-[#F5F7FA] p-2.5 rounded-lg border border-[#E2E8F0]">
                <strong>Site Attendance Impact:</strong> {lr.attendanceImpact}
              </div>
              {lr.decisionRemark && (
                <div className="text-xs text-emerald-800">
                  <strong>Decision Remark:</strong> {lr.decisionRemark}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'overtime' && (
        <div className="space-y-3">
          {siteOvertimeRequests.map((ot) => (
            <div key={ot.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#172B4D]">{ot.employeeName}</span>
                    <span className="text-xs text-[#64748B]">· {ot.designation}</span>
                    <span className="font-mono text-xs font-bold text-[#2563EB]">{ot.requestedHours} hrs OT</span>
                    <StatusBadge label={ot.status} />
                  </div>
                  <div className="text-xs text-[#64748B] font-mono mt-1">
                    Date: {ot.date} · Scheduled Shift: {ot.scheduledShift}
                  </div>
                </div>
                {ot.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOt(ot);
                      setRemark('');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white shrink-0"
                  >
                    Review Overtime
                  </button>
                )}
              </div>
              <div className="text-xs text-[#172B4D]">
                <strong>Reason:</strong> {ot.reason}
              </div>
              <div className="text-xs text-[#64748B]">{ot.supervisorRecommendation}</div>
              {ot.requiresHigherApproval && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Exceeds 4-hour daily Site Manager limit — requires Company Admin escalation.</span>
                </div>
              )}
              <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0] space-y-0.5">
                {ot.auditTrail.map((a, idx) => (
                  <div key={idx}>
                    <span className="font-mono">{a.timestamp}</span> — {a.actor}: {a.action} ({a.remark})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leave Decision Modal */}
      <Modal
        open={Boolean(selectedLeave)}
        onClose={() => setSelectedLeave(null)}
        title={`Review Leave — ${selectedLeave?.employeeName ?? ''}`}
        subtitle={selectedLeave?.attendanceImpact}
      >
        <div className="space-y-4 text-xs">
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Enter approval/rejection remarks or backup crew note..."
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => handleLeaveDecision('Clarification Requested')} className="px-3 py-2 rounded-lg border border-[#E2E8F0]">
              Clarify
            </button>
            <button type="button" onClick={() => handleLeaveDecision('Rejected')} className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white font-semibold">
              Reject
            </button>
            <button type="button" onClick={() => handleLeaveDecision('Approved')} className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white font-semibold">
              Approve Leave
            </button>
          </div>
        </div>
      </Modal>

      {/* Overtime Decision Modal */}
      <Modal
        open={Boolean(selectedOt)}
        onClose={() => setSelectedOt(null)}
        title={`Review Overtime — ${selectedOt?.employeeName ?? ''}`}
        subtitle={
          selectedOt?.requiresHigherApproval
            ? 'Exceeds Site Manager delegated limit — Escalate to Admin for final sign-off'
            : 'Within Site Manager delegated authority'
        }
      >
        <div className="space-y-4 text-xs">
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Enter operational justification / decision note..."
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => handleOtDecision('Rejected')} className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white font-semibold">
              Reject
            </button>
            {selectedOt?.requiresHigherApproval ? (
              <button type="button" onClick={() => handleOtDecision('Escalated to Admin')} className="px-3.5 py-2 rounded-lg bg-[#D97706] text-white font-semibold">
                Escalate to Admin
              </button>
            ) : (
              <button type="button" onClick={() => handleOtDecision('Approved')} className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white font-semibold">
                Approve Overtime
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
