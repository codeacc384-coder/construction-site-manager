import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, PlusCircle, History } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { WorkActivity } from '../../types/domain';
import { cn } from '../../utils/format';

export const SiteProgressPage: React.FC = () => {
  const { activeSite, siteActivities } = useSiteContext();
  const updateWorkProgress = useBuildFlowStore((s) => s.updateWorkProgress);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<WorkActivity | null>(null);
  const [addedQty, setAddedQty] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [evidenceLabel, setEvidenceLabel] = useState<string>('');

  const filteredActivities = useMemo(() => {
    if (categoryFilter === 'ALL') return siteActivities;
    if (categoryFilter === 'DELAYED') return siteActivities.filter((a) => a.status === 'Delayed');
    return siteActivities.filter((a) => a.category === categoryFilter);
  }, [siteActivities, categoryFilter]);

  const delayedCount = siteActivities.filter((a) => a.status === 'Delayed').length;
  const completedCount = siteActivities.filter((a) => a.status === 'Completed').length;
  const variance = activeSite.overallProgress - activeSite.plannedProgress;

  const chartData = siteActivities.map((a) => ({
    name: a.category,
    Planned: a.plannedProgressPct,
    Actual: a.progressPct,
  }));

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    const num = Number(addedQty);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Enter a valid positive quantity completed.');
      return;
    }
    const result = updateWorkProgress(
      selectedActivity.id,
      num,
      remarks.trim() || 'Site progress verified',
      evidenceLabel.trim() || undefined
    );
    if (result.ok) {
      toast.success(result.message);
      setSelectedActivity(null);
      setAddedQty('');
      setRemarks('');
      setEvidenceLabel('');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Site Progress & Work Breakdown"
        description={`Quantity-based physical progress tracking for ${activeSite.name}. Progress percentages auto-calculate from approved quantities.`}
        breadcrumbs={[{ label: 'Site Workspace', to: '/' }, { label: 'Site Progress' }]}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'DELAYED', 'Foundation', 'Structural Work', 'Masonry', 'RCC', 'Electrical', 'Plumbing', 'Finishing'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    categoryFilter === cat
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#172B4D]'
                  )}
                >
                  {cat === 'ALL' ? 'All Activities' : cat === 'DELAYED' ? `Delayed (${delayedCount})` : cat}
                </button>
              )
            )}
          </div>
        }
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Actual Overall Progress</div>
          <div className="text-2xl font-bold text-[#172B4D] font-display tabular-nums mt-1">
            {activeSite.overallProgress}%
          </div>
          <div className="text-xs text-[#64748B] mt-1">Target finish: {activeSite.expectedCompletionDate}</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Planned Baseline</div>
          <div className="text-2xl font-bold text-[#172B4D] font-display tabular-nums mt-1">
            {activeSite.plannedProgress}%
          </div>
          <div
            className={cn(
              'text-xs font-medium mt-1 tabular-nums',
              variance >= 0 ? 'text-[#16A34A]' : 'text-[#D97706]'
            )}
          >
            Schedule Variance: {variance >= 0 ? `+${variance}% ahead` : `${variance}% behind`}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Completed Milestones</div>
          <div className="text-2xl font-bold text-[#16A34A] font-display tabular-nums mt-1">
            {completedCount}{' '}
            <span className="text-xs font-normal text-[#64748B]">/ {siteActivities.length}</span>
          </div>
          <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Signed off by QA
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Delayed Activities</div>
          <div className="text-2xl font-bold text-[#DC2626] font-display tabular-nums mt-1">{delayedCount}</div>
          <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" /> Require recovery plan
          </div>
        </div>
      </div>

      {/* Planned vs Actual Graph */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold text-[#172B4D] font-display mb-4">
          Planned vs Actual Progress by Work Category (%)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* WBS Activities List */}
      <div className="space-y-3">
        {filteredActivities.map((act) => (
          <div key={act.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                  <span className="font-semibold text-[#172B4D]">{act.category}</span>
                  <span>·</span>
                  <span>{act.workArea}</span>
                  <span>·</span>
                  <StatusBadge label={act.status} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#172B4D] font-display">{act.name}</h3>
                <div className="text-xs text-[#64748B]">
                  Engineer: {act.assignedEngineer} · Supervisor: {act.supervisorName} · Planned End:{' '}
                  <span className="font-mono">{act.plannedEnd}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right tabular-nums">
                  <div className="text-lg font-bold text-[#172B4D] font-mono">{act.progressPct}%</div>
                  <div className="text-xs text-[#64748B] font-mono">
                    {act.quantityCompleted} / {act.quantityPlanned} {act.unit}
                  </div>
                </div>
                {act.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(act)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Update Qty
                  </button>
                )}
              </div>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  act.status === 'Completed'
                    ? 'bg-[#16A34A]'
                    : act.status === 'Delayed'
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#2563EB]'
                )}
                style={{ width: `${act.progressPct}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B]">
              <span>Remarks: {act.remarks}</span>
              {act.updateHistory.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#172B4D]">
                  <History className="w-3.5 h-3.5 text-[#2563EB]" />
                  Latest update: +{act.updateHistory[0].addedQuantity} {act.unit} by {act.updateHistory[0].updatedBy} (
                  {act.updateHistory[0].date})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Update Quantity Progress Modal */}
      <Modal
        open={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        title="Record Quantity Progress Update"
        subtitle={
          selectedActivity
            ? `${selectedActivity.name} — Current: ${selectedActivity.quantityCompleted} / ${selectedActivity.quantityPlanned} ${selectedActivity.unit}`
            : ''
        }
      >
        <form onSubmit={handleProgressSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">
              Incremental Quantity Completed ({selectedActivity?.unit})
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={addedQty}
              onChange={(e) => setAddedQty(e.target.value)}
              placeholder="e.g., 45"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Evidence Photo Reference (Optional)</label>
            <input
              type="text"
              value={evidenceLabel}
              onChange={(e) => setEvidenceLabel(e.target.value)}
              placeholder="e.g., Floor9_Slab_Pour_18Nov.jpg"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Engineering / QA Remarks</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Specify grid/floor reference and quality sign-off..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedActivity(null)}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0]"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Verify & Update Progress
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
