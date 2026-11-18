import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Info, Plus, ReceiptIndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { SiteExpense } from '../../types/domain';
import { isWithinExpenseLimit } from '../../utils/permissions';
import { formatInr } from '../../utils/format';

export const ExpensesPage: React.FC = () => {
  const { activeSite, siteExpenses, managerProfile } = useSiteContext();
  const createExpense = useBuildFlowStore((s) => s.createExpense);
  const reviewExpense = useBuildFlowStore((s) => s.reviewExpense);

  const [createOpen, setCreateOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<SiteExpense | null>(null);
  const [remark, setRemark] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SiteExpense['category']>('Fuel');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<SiteExpense['paymentMethod']>('Petty Cash');
  const [description, setDescription] = useState('');

  const summary = useMemo(() => {
    const pending = siteExpenses.filter((e) => e.status === 'Pending Review').reduce((s, e) => s + e.amountInr, 0);
    const approved = siteExpenses
      .filter((e) => e.status === 'Approved by Site Manager' || e.status === 'Forwarded to Finance')
      .reduce((s, e) => s + e.amountInr, 0);
    const paid = siteExpenses.filter((e) => e.status === 'Paid').reduce((s, e) => s + e.amountInr, 0);
    return { pending, approved, paid, total: siteExpenses.reduce((s, e) => s + e.amountInr, 0) };
  }, [siteExpenses]);

  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    siteExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amountInr);
    });
    return Array.from(map.entries()).map(([name, Amount]) => ({ name, Amount }));
  }, [siteExpenses]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!title.trim() || !amt || amt <= 0) {
      toast.error('Provide valid expense title and amount.');
      return;
    }
    createExpense({
      siteId: activeSite.id,
      title: title.trim(),
      category,
      amountInr: amt,
      date: '2026-11-18',
      vendor: vendor.trim() || 'Local Site Vendor',
      paymentMethod,
      description: description.trim() || 'Operational site expense',
      submittedBy: managerProfile.name,
      hasReceipt: true,
    });
    toast.success('Site expense submitted for review');
    setTitle('');
    setAmount('');
    setVendor('');
    setDescription('');
    setCreateOpen(false);
  };

  const handleDecision = (decision: 'Approved by Site Manager' | 'Forwarded to Finance' | 'Rejected') => {
    if (!reviewTarget) return;
    if (decision === 'Rejected' && !remark.trim()) {
      toast.error('Please enter a reason for rejecting this expense.');
      return;
    }
    reviewExpense(reviewTarget.id, decision, remark.trim() || 'Verified site operational necessity');
    toast.success(`${reviewTarget.expenseCode}: ${decision}`);
    setReviewTarget(null);
    setRemark('');
  };

  return (
    <div>
      <PageHeader
        title="Site Expenses"
        description={`Track petty cash and operational expenses for ${activeSite.name}. Delegated approval limit: ${formatInr(managerProfile.delegatedLimits.expenseApprovalLimitInr)}.`}
        breadcrumbs={[{ label: 'Site Management', to: '/' }, { label: 'Site Expenses' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Submit Site Expense
          </button>
        }
      />

      <div className="mb-5 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-start gap-2.5 text-xs text-blue-950">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <span>
          <strong>Delegated Authority & Payment Rule:</strong> Site Manager approval verifies operational necessity up to{' '}
          <strong className="font-mono">{formatInr(managerProfile.delegatedLimits.expenseApprovalLimitInr)}</strong>. Higher amounts automatically route to Finance. Approval does <strong>not</strong> equal disbursement/payment.
        </span>
      </div>

      {/* Expense KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Monthly Site Total</div>
          <div className="text-xl font-bold text-[#172B4D] font-mono tabular-nums mt-1">{formatInr(summary.total)}</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Pending Review</div>
          <div className="text-xl font-bold text-[#D97706] font-mono tabular-nums mt-1">{formatInr(summary.pending)}</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Approved / Forwarded</div>
          <div className="text-xl font-bold text-[#2563EB] font-mono tabular-nums mt-1">{formatInr(summary.approved)}</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Settled / Paid</div>
          <div className="text-xl font-bold text-[#16A34A] font-mono tabular-nums mt-1">{formatInr(summary.paid)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#172B4D] font-display mb-4">Expenses by Category (₹)</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [formatInr(Number(v ?? 0)), 'Amount']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="Amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3">
          {siteExpenses.map((ex) => {
            const withinLimit = isWithinExpenseLimit(managerProfile, ex.amountInr);
            return (
              <div key={ex.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono font-bold text-[#172B4D]">{ex.expenseCode}</span>
                      <span className="text-[#64748B]">· {ex.category}</span>
                      <StatusBadge label={ex.status} />
                    </div>
                    <h3 className="text-sm font-bold text-[#172B4D] mt-0.5">{ex.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-[#172B4D] tabular-nums">
                        {formatInr(ex.amountInr)}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {withinLimit ? 'Within SM Limit' : 'Exceeds ₹25K Limit'}
                      </div>
                    </div>
                    {ex.status === 'Pending Review' && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewTarget(ex);
                          setRemark('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-[#64748B]">
                  {ex.vendor} · {ex.paymentMethod} · By {ex.submittedBy} ({ex.date})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Expense Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Submit Site Operational Expense">
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Expense Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Transit Mixer Diesel Top-up"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SiteExpense['category'])}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Transport">Transport</option>
                <option value="Fuel">Fuel</option>
                <option value="Equipment">Equipment</option>
                <option value="Minor Repairs">Minor Repairs</option>
                <option value="Safety Supplies">Safety Supplies</option>
                <option value="Site Maintenance">Site Maintenance</option>
                <option value="Utilities">Utilities</option>
                <option value="Labour Operational">Labour Operational</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Amount (INR)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 4500"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Vendor / Supplier</label>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as SiteExpense['paymentMethod'])}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Petty Cash">Petty Cash</option>
                <option value="UPI / Site Imprest">UPI / Site Imprest</option>
                <option value="Vendor Credit">Vendor Credit</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5">
              <ReceiptIndianRupee className="w-3.5 h-3.5" />
              Submit Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Expense Modal */}
      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title={`Review Expense — ${reviewTarget?.expenseCode ?? ''}`}
        subtitle={reviewTarget ? `${reviewTarget.title} · ${formatInr(reviewTarget.amountInr)}` : ''}
      >
        {reviewTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg">
              {reviewTarget.description}
            </div>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter verification note or rejection reason..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDecision('Rejected')}
                className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white font-semibold"
              >
                Reject
              </button>
              {isWithinExpenseLimit(managerProfile, reviewTarget.amountInr) ? (
                <button
                  type="button"
                  onClick={() => handleDecision('Approved by Site Manager')}
                  className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white font-semibold"
                >
                  Approve Expense
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDecision('Forwarded to Finance')}
                  className="px-3.5 py-2 rounded-lg bg-[#D97706] text-white font-semibold"
                >
                  Forward to Finance (&gt;₹25K)
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
