import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { InventoryTransaction } from '../../types/domain';
import { cn, formatInr } from '../../utils/format';

export const InventoryPage: React.FC = () => {
  const { activeSite, siteInventory, siteTransactions, can } = useSiteContext();
  const recordInventoryAdjustment = useBuildFlowStore((s) => s.recordInventoryAdjustment);

  const [tab, setTab] = useState<'stock' | 'ledger'>('stock');
  const [search, setSearch] = useState('');
  const [txModalOpen, setTxModalOpen] = useState(false);

  const [materialId, setMaterialId] = useState(siteInventory[0]?.id ?? '');
  const [txType, setTxType] = useState<InventoryTransaction['type']>('Material Issue');
  const [qty, setQty] = useState('10');
  const [destination, setDestination] = useState(activeSite.geofence.zones[0]?.name ?? 'Tower A');
  const [remarks, setRemarks] = useState('');

  const filteredStock = useMemo(() => {
    if (!search.trim()) return siteInventory;
    const q = search.toLowerCase();
    return siteInventory.filter((i) => `${i.name} ${i.materialCode} ${i.category}`.toLowerCase().includes(q));
  }, [siteInventory, search]);

  const totalStockValue = siteInventory.reduce((sum, i) => sum + i.availableQuantity * i.unitValueInr, 0);

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericQty = Number(qty);
    if (!numericQty || numericQty <= 0) {
      toast.error('Enter a valid positive quantity.');
      return;
    }
    const isOutbound = txType === 'Material Issue' || txType === 'Material Consumption' || txType === 'Damaged Material' || txType === 'Material Transfer';
    const delta = isOutbound ? -numericQty : numericQty;

    const res = recordInventoryAdjustment({
      materialId: materialId || siteInventory[0]?.id,
      type: txType,
      quantityDelta: delta,
      destination,
      remarks: remarks.trim() || 'Authorized site stores transaction',
    });

    if (res.ok) {
      toast.success(res.message);
      setTxModalOpen(false);
      setRemarks('');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Site Inventory & Stock Ledger"
        description={`Real-time site-scoped inventory for ${activeSite.name}. All stock changes require an auditable transaction record.`}
        breadcrumbs={[{ label: 'Materials & Assets', to: '/' }, { label: 'Site Inventory' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => {
              setMaterialId(siteInventory[0]?.id ?? '');
              setTxModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Record Stock Transaction
          </button>
        }
      />

      {/* Inventory KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Material Categories</div>
          <div className="text-xl font-bold text-[#172B4D] font-display tabular-nums mt-1">
            {siteInventory.length} SKUs
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Low / Out-of-Stock Items</div>
          <div className="text-xl font-bold text-[#DC2626] font-display tabular-nums mt-1">
            {siteInventory.filter((i) => i.status !== 'Normal').length}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Site Stock Valuation</div>
          <div className="text-xl font-bold text-[#172B4D] font-mono tabular-nums mt-1">
            {can('canViewStockValuation') ? formatInr(totalStockValue) : 'Restricted'}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Audited Movements</div>
          <div className="text-xl font-bold text-[#2563EB] font-display tabular-nums mt-1">
            {siteTransactions.length}
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('stock')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold',
              tab === 'stock' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            Current Stock ({siteInventory.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold',
              tab === 'ledger' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            Transaction Ledger ({siteTransactions.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material or code..."
            className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
          />
        </div>
      </div>

      {tab === 'stock' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Available</th>
                  <th className="py-3 px-3 text-right">Reserved</th>
                  <th className="py-3 px-3 text-right">Min Level</th>
                  <th className="py-3 px-3">Last Receipt</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F7FA]/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{item.name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{item.materialCode}</div>
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">{item.category}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#172B4D]">
                      {item.availableQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#64748B]">
                      {item.reservedQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#64748B]">
                      {item.minimumStockLevel} {item.unit}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#64748B]">{item.lastReceiptDate}</td>
                    <td className="py-3 px-4">
                      <StatusBadge label={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3">Source → Destination</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {siteTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 px-4 font-mono text-[#64748B]">{tx.timestamp}</td>
                    <td className="py-3 px-3"><StatusBadge label={tx.type} tone={tx.quantity >= 0 ? 'success' : 'info'} /></td>
                    <td className="py-3 px-3 font-semibold text-[#172B4D]">{tx.materialName}</td>
                    <td
                      className={cn(
                        'py-3 px-3 text-right font-mono font-bold tabular-nums',
                        tx.quantity >= 0 ? 'text-[#16A34A]' : 'text-[#172B4D]'
                      )}
                    >
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">
                      {tx.source} → {tx.destination}
                    </td>
                    <td className="py-3 px-4 text-[#172B4D]">{tx.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <Modal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Record Auditable Stock Transaction"
        subtitle="Every stock movement creates an immutable ledger entry"
      >
        <form onSubmit={handleTxSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Material</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              {siteInventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Avail: {i.availableQuantity} {i.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Transaction Type</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as InventoryTransaction['type'])}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Material Issue">Material Issue (Outbound)</option>
                <option value="Damaged Material">Damaged Material Write-off</option>
                <option value="Material Transfer">Material Transfer Out</option>
                <option value="Stock Adjustment">Stock Adjustment (Add)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Destination / Work Area</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTxModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Post Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
