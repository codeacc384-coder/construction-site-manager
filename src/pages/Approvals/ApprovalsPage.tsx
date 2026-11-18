import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { cn, formatInr } from '../../utils/format';

export const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeSite,
    siteExceptions,
    siteLeaveRequests,
    siteOvertimeRequests,
    sitePurchaseRequests,
    siteReceipts,
    siteExpenses,
    managerProfile,
  } = useSiteContext();

  const reviewAttendanceException = useBuildFlowStore((s) => s.reviewAttendanceException);
  const reviewLeaveRequest = useBuildFlowStore((s) => s.reviewLeaveRequest);
  const reviewOvertimeRequest = useBuildFlowStore((s) => s.reviewOvertimeRequest);
  const reviewPurchaseRequest = useBuildFlowStore((s) => s.reviewPurchaseRequest);
  const reviewExpense = useBuildFlowStore((s) => s.reviewExpense);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [remarksById, setRemarksById] = useState<Record<string, string>>({});

  const queue = useMemo(() => {
    const items = [
      ...siteExceptions
        .filter((e) => e.status === 'Pending')
        .map((e) => ({
          id: e.id,
          kind: 'Attendance Correction' as const,
          title: `${e.employeeName} — ${e.exceptionType}`,
          detail: `${e.date} · Requested ${e.requestedTime} · ${e.reason}`,
          requester: e.submittedBy,
          date: e.date,
          priority: 'High',
          chain: 'Employee/Supervisor → Site Manager (Current)',
          route: '/attendance',
        })),
      ...siteLeaveRequests
        .filter((l) => l.status === 'Pending')
        .map((l) => ({
          id: l.id,
          kind: 'Leave Request' as const,
          title: `${l.employeeName} — ${l.leaveType} (${l.days}d)`,
          detail: `${l.startDate} to ${l.endDate} · ${l.attendanceImpact}`,
          requester: l.employeeName,
          date: l.startDate,
          priority: 'Medium',
          chain: 'Employee → Site Manager (Current)',
          route: '/requests',
        })),
      ...siteOvertimeRequests
        .filter((o) => o.status === 'Pending')
        .map((o) => ({
          id: o.id,
          kind: 'Overtime Request' as const,
          title: `${o.employeeName} — ${o.requestedHours} hrs OT`,
          detail: `${o.date} · ${o.reason}`,
          requester: o.supervisorRecommendation,
          date: o.date,
          priority: o.requiresHigherApproval ? 'High' : 'Medium',
          chain: o.requiresHigherApproval
            ? 'Supervisor → Site Manager → Company Admin'
            : 'Supervisor → Site Manager (Current)',
          route: '/requests',
        })),
      ...sitePurchaseRequests
        .filter((p) => p.status === 'Pending Site Manager')
        .map((p) => ({
          id: p.id,
          kind: 'Purchase Request' as const,
          title: `${p.requestCode} — ${p.title} (${formatInr(p.estimatedTotal)})`,
          detail: `${p.workArea} · ${p.reason}`,
          requester: p.requesterName,
          date: p.requestDate,
          priority: p.priority,
          chain:
            p.estimatedTotal <= managerProfile.delegatedLimits.purchaseApprovalLimitInr
              ? 'Site Engineer → Site Manager → Procurement'
              : 'Site Engineer → Site Manager → Procurement & Finance',
          route: '/procurement',
        })),
      ...siteReceipts
        .filter((r) => r.status === 'Received Pending Verification')
        .map((r) => ({
          id: r.id,
          kind: 'Material Receipt' as const,
          title: `${r.poNumber} — ${r.materialName} (${r.receivedQuantity} ${r.unit})`,
          detail: `${r.supplier} · Challan ${r.challanNumber} · ${r.remarks}`,
          requester: 'Site Gate / Stores',
          date: r.deliveryDateTime,
          priority: 'High',
          chain: 'Storekeeper → Site Manager Physical Verification',
          route: '/receipts',
        })),
      ...siteExpenses
        .filter((ex) => ex.status === 'Pending Review')
        .map((ex) => ({
          id: ex.id,
          kind: 'Site Expense' as const,
          title: `${ex.expenseCode} — ${ex.title} (${formatInr(ex.amountInr)})`,
          detail: `${ex.category} · ${ex.vendor} · ${ex.description}`,
          requester: ex.submittedBy,
          date: ex.date,
          priority: ex.amountInr > managerProfile.delegatedLimits.expenseApprovalLimitInr ? 'High' : 'Medium',
          chain:
            ex.amountInr <= managerProfile.delegatedLimits.expenseApprovalLimitInr
              ? 'Requester → Site Manager (Current)'
              : 'Requester → Site Manager → Finance (>₹25K)',
          route: '/expenses',
        })),
    ];

    if (categoryFilter === 'ALL') return items;
    return items.filter((i) => i.kind === categoryFilter);
  }, [
    siteExceptions,
    siteLeaveRequests,
    siteOvertimeRequests,
    sitePurchaseRequests,
    siteReceipts,
    siteExpenses,
    managerProfile,
    categoryFilter,
  ]);

  const handleQuickApprove = (item: (typeof queue)[number]) => {
    const note = remarksById[item.id]?.trim() || 'Approved by Site Manager';
    if (item.kind === 'Attendance Correction') {
      reviewAttendanceException(item.id, 'Approved', note);
    } else if (item.kind === 'Leave Request') {
      reviewLeaveRequest(item.id, 'Approved', note);
    } else if (item.kind === 'Overtime Request') {
      const ot = siteOvertimeRequests.find((o) => o.id === item.id);
      reviewOvertimeRequest(item.id, ot?.requiresHigherApproval ? 'Escalated to Admin' : 'Approved', note);
    } else if (item.kind === 'Purchase Request') {
      const pr = sitePurchaseRequests.find((p) => p.id === item.id);
      const within = (pr?.estimatedTotal ?? 0) <= managerProfile.delegatedLimits.purchaseApprovalLimitInr;
      reviewPurchaseRequest(item.id, within ? 'Approved by Site Manager' : 'Forwarded to Procurement', note);
    } else if (item.kind === 'Site Expense') {
      const ex = siteExpenses.find((e) => e.id === item.id);
      const within = (ex?.amountInr ?? 0) <= managerProfile.delegatedLimits.expenseApprovalLimitInr;
      reviewExpense(item.id, within ? 'Approved by Site Manager' : 'Forwarded to Finance', note);
    } else {
      navigate(item.route);
      return;
    }
    toast.success(`Processed: ${item.title}`);
  };

  const handleQuickReject = (item: (typeof queue)[number]) => {
    const note = remarksById[item.id]?.trim();
    if (!note) {
      toast.error('Enter a rejection remark before rejecting.');
      return;
    }
    if (item.kind === 'Attendance Correction') reviewAttendanceException(item.id, 'Rejected', note);
    else if (item.kind === 'Leave Request') reviewLeaveRequest(item.id, 'Rejected', note);
    else if (item.kind === 'Overtime Request') reviewOvertimeRequest(item.id, 'Rejected', note);
    else if (item.kind === 'Purchase Request') reviewPurchaseRequest(item.id, 'Rejected', note);
    else if (item.kind === 'Site Expense') reviewExpense(item.id, 'Rejected', note);
    else {
      navigate(item.route);
      return;
    }
    toast.info(`Rejected: ${item.title}`);
  };

  return (
    <div>
      <PageHeader
        title="Approval Centre"
        description={`Centralized queue of operational approvals assigned to you on ${activeSite.name}. Maker-checker separation and audit remarks enforced.`}
        breadcrumbs={[{ label: 'Site Management', to: '/' }, { label: 'Approvals' }]}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {[
              'ALL',
              'Attendance Correction',
              'Leave Request',
              'Overtime Request',
              'Purchase Request',
              'Material Receipt',
              'Site Expense',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  categoryFilter === cat
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0]'
                )}
              >
                {cat === 'ALL' ? `All Pending (${queue.length})` : cat}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-5 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-center gap-2.5 text-xs text-blue-950">
        <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
        <span>
          <strong>Maker-Checker & Audit Enforcement:</strong> Rejection remarks are mandatory. Material Receipts require physical quantity verification in the Material Receipts module before inventory updates.
        </span>
      </div>

      {queue.length === 0 ? (
        <EmptyState
          title="Approval queue is clear"
          description={`All pending operational approvals for ${activeSite.name} have been processed.`}
        />
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge label={item.kind} tone="info" />
                    <StatusBadge label={item.priority} />
                    <span className="font-mono text-[#64748B]">{item.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B4D] font-display">{item.title}</h3>
                  <p className="text-xs text-[#64748B]">{item.detail}</p>
                  <div className="text-[11px] text-[#64748B] pt-1">
                    Requester: <strong className="text-[#172B4D]">{item.requester}</strong> · Chain:{' '}
                    <span className="font-mono">{item.chain}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  {item.kind === 'Material Receipt' ? (
                    <button
                      type="button"
                      onClick={() => navigate('/receipts')}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white"
                    >
                      Open GRN Verification
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Decision remark..."
                        value={remarksById[item.id] ?? ''}
                        onChange={(e) => setRemarksById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickReject(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#DC2626] text-white"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16A34A] text-white inline-flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve / Forward
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
