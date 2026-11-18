import React, { useState } from 'react';
import { CheckCircle2, Info, PackageCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { MaterialReceipt } from '../../types/domain';

export const ReceiptsPage: React.FC = () => {
  const { activeSite, siteReceipts } = useSiteContext();
  const verifyMaterialReceipt = useBuildFlowStore((s) => s.verifyMaterialReceipt);

  const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceipt | null>(null);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');

  const openVerifyModal = (rec: MaterialReceipt) => {
    setSelectedReceipt(rec);
    setReceivedQty(rec.receivedQuantity || rec.orderedQuantity);
    setDamagedQty(rec.damagedQuantity);
    setRemarks(rec.remarks);
  };

  const handleVerifySubmit = (nextStatus: MaterialReceipt['status']) => {
    if (!selectedReceipt) return;
    if (receivedQty < 0 || damagedQty < 0 || damagedQty > receivedQty) {
      toast.error('Damaged quantity cannot exceed received quantity.');
      return;
    }
    verifyMaterialReceipt(selectedReceipt.id, {
      receivedQuantity: receivedQty,
      damagedQuantity: damagedQty,
      status: nextStatus,
      remarks: remarks.trim() || 'Physical gate inspection completed.',
    });
    if (nextStatus === 'Verified') {
      toast.success(
        `Verified ${selectedReceipt.poNumber}: Accepted ${receivedQty - damagedQty} ${selectedReceipt.unit} added to site inventory.`
      );
    } else {
      toast.info(`Updated receipt ${selectedReceipt.poNumber} to ${nextStatus}`);
    }
    setSelectedReceipt(null);
  };

  return (
    <div>
      <PageHeader
        title="Material Receipts & GRN Verification"
        description={`Verify incoming supplier deliveries against Purchase Orders for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Materials & Assets', to: '/' }, { label: 'Material Receipts' }]}
      />

      <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span>
          <strong>Inventory Integrity Rule:</strong> Uploading a supplier invoice or challan does <strong>not</strong> increment site stock. Inventory balances only update after an authorized Site Manager or Site Engineer verifies accepted quantity.
        </span>
      </div>

      <div className="space-y-3">
        {siteReceipts.map((rec) => (
          <div key={rec.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-[#172B4D]">{rec.poNumber}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[#64748B]">{rec.supplier}</span>
                  <span className="text-slate-300">·</span>
                  <StatusBadge label={rec.status} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#172B4D] font-display">{rec.materialName}</h3>
                <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> {rec.vehicleNumber}
                  </span>
                  <span>Challan: <span className="font-mono">{rec.challanNumber}</span></span>
                  <span>Invoice: <span className="font-mono">{rec.invoiceReference}</span></span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="grid grid-cols-3 gap-3 text-center text-xs tabular-nums bg-[#F5F7FA] px-3.5 py-2 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <div className="text-[10px] text-[#64748B]">Ordered</div>
                    <div className="font-mono font-bold text-[#172B4D]">{rec.orderedQuantity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Damaged</div>
                    <div className="font-mono font-bold text-[#DC2626]">{rec.damagedQuantity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Accepted</div>
                    <div className="font-mono font-bold text-[#16A34A]">{rec.acceptedQuantity}</div>
                  </div>
                </div>

                {rec.status !== 'Verified' && rec.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => openVerifyModal(rec)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    Verify Delivery
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
              <span>Remarks: {rec.remarks}</span>
              {rec.verifiedBy && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified by {rec.verifiedBy}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={`Verify Delivery — ${selectedReceipt?.poNumber ?? ''}`}
        subtitle={selectedReceipt ? `${selectedReceipt.materialName} · Ordered: ${selectedReceipt.orderedQuantity} ${selectedReceipt.unit}` : ''}
      >
        {selectedReceipt && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Received Qty ({selectedReceipt.unit})
                </label>
                <input
                  type="number"
                  min={0}
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Damaged / Rejected
                </label>
                <input
                  type="number"
                  min={0}
                  value={damagedQty}
                  onChange={(e) => setDamagedQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Accepted Into Stock</label>
                <div className="px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F5F7FA] font-mono font-bold text-[#16A34A]">
                  {Math.max(0, receivedQty - damagedQty)} {selectedReceipt.unit}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Inspection & Challan Remarks</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleVerifySubmit('Disputed')}
                className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-semibold"
              >
                Flag Disputed
              </button>
              <button
                type="button"
                onClick={() => handleVerifySubmit('Rejected')}
                className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white font-semibold"
              >
                Reject Lot
              </button>
              <button
                type="button"
                onClick={() => handleVerifySubmit('Verified')}
                className="px-4 py-2 rounded-lg bg-[#16A34A] text-white font-semibold"
              >
                Confirm & Update Site Stock
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
