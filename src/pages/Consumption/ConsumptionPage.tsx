import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const ConsumptionPage: React.FC = () => {
  const { activeSite, siteConsumption, siteInventory, siteActivities } = useSiteContext();
  const recordMaterialConsumption = useBuildFlowStore((s) => s.recordMaterialConsumption);

  const [modalOpen, setModalOpen] = useState(false);
  const [activityId, setActivityId] = useState(siteActivities[0]?.id ?? '');
  const [materialId, setMaterialId] = useState(siteInventory[0]?.id ?? '');
  const [plannedQty, setPlannedQty] = useState('40');
  const [quantityUsed, setQuantityUsed] = useState('38');
  const [remarks, setRemarks] = useState('');

  const chartData = siteConsumption.map((c) => ({
    name: c.materialName.split(' ').slice(0, 2).join(' '),
    Planned: c.plannedQty,
    Actual: c.quantityUsed,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = recordMaterialConsumption({
      activityId: activityId || siteActivities[0]?.id,
      materialId: materialId || siteInventory[0]?.id,
      plannedQty: Number(plannedQty),
      quantityUsed: Number(quantityUsed),
      remarks: remarks.trim() || 'Daily activity consumption logged.',
    });
    if (res.ok) {
      toast.success(res.message);
      setModalOpen(false);
      setRemarks('');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Material Consumption"
        description={`Track planned vs actual material usage by work activity for ${activeSite.name}. Linked directly to verified site inventory.`}
        breadcrumbs={[{ label: 'Materials & Assets', to: '/' }, { label: 'Material Consumption' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => {
              setActivityId(siteActivities[0]?.id ?? '');
              setMaterialId(siteInventory[0]?.id ?? '');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Log Consumption
          </button>
        }
      />

      {chartData.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold text-[#172B4D] font-display mb-4">Planned vs Actual Material Usage</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Work Activity & Area</th>
                <th className="py-3 px-3">Material</th>
                <th className="py-3 px-3 text-right">Planned</th>
                <th className="py-3 px-3 text-right">Used</th>
                <th className="py-3 px-3">Variance</th>
                <th className="py-3 px-4">Submitted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {siteConsumption.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F5F7FA]/60">
                  <td className="py-3 px-4 font-mono text-[#64748B]">{rec.date}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#172B4D]">{rec.activityName}</div>
                    <div className="text-[11px] text-[#64748B]">{rec.workArea}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#172B4D]">{rec.materialName}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#64748B]">
                    {rec.plannedQty} {rec.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#172B4D]">
                    {rec.quantityUsed} {rec.unit}
                  </td>
                  <td className="py-3 px-3">
                    {rec.varianceFlag ? (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Over Norm (+10%)
                      </span>
                    ) : (
                      <StatusBadge label="Normal" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">{rec.submittedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Material Consumption"
        subtitle="Automatically validates against and deducts from site stores inventory"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Work Activity</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              {siteActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.workArea})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Inventory Material</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              {siteInventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — Available: {i.availableQuantity} {i.unit}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Planned Qty</label>
              <input
                type="number"
                step="0.5"
                value={plannedQty}
                onChange={(e) => setPlannedQty(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Actual Used Qty</label>
              <input
                type="number"
                step="0.5"
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Record Consumption
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
