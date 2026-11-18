import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { PriorityLevel, PurchaseItem, PurchaseRequest } from '../../types/domain';
import { isWithinPurchaseLimit } from '../../utils/permissions';
import { formatInr } from '../../utils/format';

export const ProcurementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeSite, sitePurchaseRequests, siteInventory, managerProfile } = useSiteContext();
  const createPurchaseRequest = useBuildFlowStore((s) => s.createPurchaseRequest);
  const reviewPurchaseRequest = useBuildFlowStore((s) => s.reviewPurchaseRequest);

  const [createOpen, setCreateOpen] = useState(searchParams.get('action') === 'new');
  const [reviewTarget, setReviewTarget] = useState<PurchaseRequest | null>(null);
  const [decisionRemark, setDecisionRemark] = useState('');

  // Create form state with multi-line items
  const [title, setTitle] = useState('');
  const [workArea, setWorkArea] = useState(activeSite.geofence.zones[0]?.name ?? 'Tower A');
  const [supplier, setSupplier] = useState('Deccan BuildMart Pvt Ltd');
  const [requiredDate, setRequiredDate] = useState('2026-11-22');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: 'item-1',
      category: 'Cement & Aggregates',
      materialName: '',
      specification: '',
      quantity: 100,
      unit: 'Bags',
      estimatedUnitPrice: 395,
    },
  ]);

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        category: 'Reinforcement Steel',
        materialName: '',
        specification: '',
        quantity: 1,
        unit: 'Tonnes',
        estimatedUnitPrice: 62000,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalEstimate = items.reduce((acc, it) => acc + it.quantity * it.estimatedUnitPrice, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || items.some((i) => !i.materialName.trim() || i.quantity <= 0)) {
      toast.error('Provide request title and valid line-item material names and quantities.');
      return;
    }
    createPurchaseRequest({
      siteId: activeSite.id,
      title: title.trim(),
      workArea,
      requesterName: managerProfile.name,
      requesterRole: managerProfile.designation,
      requestDate: '2026-11-18',
      requiredByDate: requiredDate,
      preferredSupplier: supplier,
      priority,
      reason: reason.trim() || 'Site stock replenishment',
      items,
      estimatedTotal: totalEstimate,
      stockChecked: true,
    });
    toast.success('Purchase Request created and routed to approval queue');
    setTitle('');
    setReason('');
    setCreateOpen(false);
  };

  const handleDecision = (
    decision: 'Approved by Site Manager' | 'Forwarded to Procurement' | 'Clarification Requested' | 'Rejected'
  ) => {
    if (!reviewTarget) return;
    if (decision === 'Rejected' && !decisionRemark.trim()) {
      toast.error('Remarks are mandatory when rejecting a purchase request.');
      return;
    }
    reviewPurchaseRequest(reviewTarget.id, decision, decisionRemark.trim() || 'Verified against site requirement');
    toast.success(`${reviewTarget.requestCode} updated: ${decision}`);
    setReviewTarget(null);
    setDecisionRemark('');
  };

  return (
    <div>
      <PageHeader
        title="Procurement Requests"
        description={`Site purchase requests for ${activeSite.name}. Delegated approval limit: ${formatInr(managerProfile.delegatedLimits.purchaseApprovalLimitInr)}.`}
        breadcrumbs={[{ label: 'Materials & Assets', to: '/' }, { label: 'Procurement Requests' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Request
          </button>
        }
      />

      <div className="mb-5 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-start gap-2.5 text-xs text-blue-950">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <span>
          <strong>Workflow Rule:</strong> Approving a purchase request routes it to Procurement / Finance for PO issuance. Approval does <strong>not</strong> mark the order as paid or delivered — stock only updates after verified Material Receipt.
        </span>
      </div>

      <div className="space-y-4">
        {sitePurchaseRequests.map((pr) => {
          const withinLimit = isWithinPurchaseLimit(managerProfile, pr.estimatedTotal);
          return (
            <div key={pr.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#172B4D]">{pr.requestCode}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[#64748B]">{pr.workArea}</span>
                    <span className="text-slate-300">·</span>
                    <StatusBadge label={pr.priority} />
                    <StatusBadge label={pr.status} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#172B4D] font-display">{pr.title}</h3>
                  <div className="text-xs text-[#64748B]">
                    Requested by {pr.requesterName} ({pr.requesterRole}) · Required by{' '}
                    <span className="font-mono">{pr.requiredByDate}</span> · Supplier: {pr.preferredSupplier}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-bold text-[#172B4D] font-mono tabular-nums">
                      {formatInr(pr.estimatedTotal)}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {withinLimit ? 'Within SM Limit' : 'Exceeds SM ₹1.5L Limit'}
                    </div>
                  </div>
                  {pr.status === 'Pending Site Manager' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewTarget(pr);
                        setDecisionRemark('');
                      }}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3">Specification</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Est. Rate</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {pr.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-[#172B4D]">{item.materialName}</td>
                        <td className="py-2 px-3 text-[#64748B]">{item.specification}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {formatInr(item.estimatedUnitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                          {formatInr(item.quantity * item.estimatedUnitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                <span>Reason: {pr.reason}</span>
                <span className="font-mono text-[11px]">Workflow Step: {pr.currentStep}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Multi-Line Purchase Request Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Multi-Item Purchase Request"
        subtitle={`Scoped to ${activeSite.name}`}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Request Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Floor 10 Cement & Rebar Stirrup Lot"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Required By</label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#172B4D]">Line Items</span>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                + Add Line Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    placeholder="Material name"
                    value={item.materialName}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, materialName: e.target.value } : x))
                      )
                    }
                    className="sm:col-span-5 px-2.5 py-1.5 border border-[#E2E8F0] rounded bg-white"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x))
                      )
                    }
                    className="sm:col-span-2 px-2.5 py-1.5 border border-[#E2E8F0] rounded bg-white font-mono"
                  />
                  <input
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) =>
                      setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x)))
                    }
                    className="sm:col-span-2 px-2.5 py-1.5 border border-[#E2E8F0] rounded bg-white"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Unit ₹"
                    value={item.estimatedUnitPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, estimatedUnitPrice: Number(e.target.value) } : x
                        )
                      )
                    }
                    className="sm:col-span-2 px-2.5 py-1.5 border border-[#E2E8F0] rounded bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="sm:col-span-1 flex items-center justify-center text-[#DC2626] hover:bg-red-50 rounded"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Preferred Supplier</label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Estimated Total</label>
              <div className="px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F5F7FA] font-mono font-bold text-[#172B4D]">
                {formatInr(totalEstimate)}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Reason for Purchase</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Submit Purchase Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Purchase Request Modal */}
      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title={`Review ${reviewTarget?.requestCode ?? ''}`}
        subtitle={reviewTarget ? `${reviewTarget.title} · Est. ${formatInr(reviewTarget.estimatedTotal)}` : ''}
      >
        {reviewTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] space-y-1.5">
              <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                Current Site Stock Check ({activeSite.code})
              </div>
              {siteInventory.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex justify-between text-[#64748B]">
                  <span>{inv.name}</span>
                  <span className="font-mono">
                    {inv.availableQuantity} {inv.unit} ({inv.status})
                  </span>
                </div>
              ))}
            </div>

            <textarea
              rows={3}
              value={decisionRemark}
              onChange={(e) => setDecisionRemark(e.target.value)}
              placeholder="Enter verification remarks or reason for rejection/clarification..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDecision('Clarification Requested')}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0]"
              >
                Send Back
              </button>
              <button
                type="button"
                onClick={() => handleDecision('Rejected')}
                className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white font-semibold"
              >
                Reject
              </button>
              {isWithinPurchaseLimit(managerProfile, reviewTarget.estimatedTotal) ? (
                <button
                  type="button"
                  onClick={() => handleDecision('Approved by Site Manager')}
                  className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white font-semibold"
                >
                  Approve (Within Limit)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDecision('Forwarded to Procurement')}
                  className="px-3.5 py-2 rounded-lg bg-[#D97706] text-white font-semibold"
                >
                  Forward for Higher Approval
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
