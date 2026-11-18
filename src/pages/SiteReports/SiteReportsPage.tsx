import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { PageHeader } from '../../components/common/PageHeader';
import { exportToCsv } from '../../utils/csv';
import { cn, formatInr } from '../../utils/format';

const REPORT_TYPES = [
  'Daily Site Report',
  'Workforce Attendance Report',
  'Workforce Allocation Report',
  'Site Progress Report',
  'Material Receipt Report',
  'Inventory Report',
  'Material Consumption Report',
  'Equipment Utilization Report',
  'Safety Incident Report',
  'Site Expense Report',
  'Contractor Work Report',
  'Delayed Activity Report',
] as const;

type ReportType = (typeof REPORT_TYPES)[number];

export const SiteReportsPage: React.FC = () => {
  const {
    activeSite,
    siteDailyReports,
    siteAttendance,
    siteEmployees,
    siteActivities,
    siteReceipts,
    siteInventory,
    siteConsumption,
    siteEquipment,
    siteIncidents,
    siteExpenses,
    siteContractors,
  } = useSiteContext();

  const [selectedReport, setSelectedReport] = useState<ReportType>('Daily Site Report');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('2026-11-01');
  const [dateTo, setDateTo] = useState('2026-11-18');

  const rows: Array<Record<string, string | number>> = useMemo(() => {
    switch (selectedReport) {
      case 'Daily Site Report':
        return siteDailyReports.map((r) => ({
          Date: r.date,
          Status: r.status,
          Present: `${r.workersPresent}/${r.totalWorkforce}`,
          WorkCompleted: r.workCompleted,
          SubmittedBy: r.submittedBy,
        }));
      case 'Workforce Attendance Report':
        return siteAttendance.map((a) => ({
          EmpCode: a.employeeCode,
          Employee: a.employeeName,
          Designation: a.designation,
          CheckIn: a.checkInTime ?? '—',
          CheckOut: a.checkOutTime ?? 'On Site',
          GPS: a.gpsVerification,
          Status: a.approvalStatus,
        }));
      case 'Workforce Allocation Report':
        return siteEmployees.map((e) => ({
          EmpCode: e.empCode,
          Name: e.name,
          Category: e.designation,
          WorkArea: e.workArea,
          Supervisor: e.supervisorName,
          Employment: e.employmentType,
        }));
      case 'Site Progress Report':
        return siteActivities.map((w) => ({
          Category: w.category,
          Activity: w.name,
          PlannedPct: `${w.plannedProgressPct}%`,
          ActualPct: `${w.progressPct}%`,
          CompletedQty: `${w.quantityCompleted} ${w.unit}`,
          Status: w.status,
        }));
      case 'Material Receipt Report':
        return siteReceipts.map((r) => ({
          PONumber: r.poNumber,
          Supplier: r.supplier,
          Material: r.materialName,
          Ordered: `${r.orderedQuantity} ${r.unit}`,
          Accepted: `${r.acceptedQuantity} ${r.unit}`,
          Status: r.status,
        }));
      case 'Inventory Report':
        return siteInventory.map((i) => ({
          Code: i.materialCode,
          Material: i.name,
          Available: `${i.availableQuantity} ${i.unit}`,
          MinLevel: `${i.minimumStockLevel} ${i.unit}`,
          Status: i.status,
        }));
      case 'Material Consumption Report':
        return siteConsumption.map((c) => ({
          Date: c.date,
          Activity: c.activityName,
          Material: c.materialName,
          Planned: `${c.plannedQty} ${c.unit}`,
          ActualUsed: `${c.quantityUsed} ${c.unit}`,
          VarianceAlert: c.varianceFlag ? 'Over Norm' : 'Normal',
        }));
      case 'Equipment Utilization Report':
        return siteEquipment.map((eq) => ({
          AssetCode: eq.assetCode,
          Equipment: eq.name,
          Operator: eq.assignedOperator,
          HoursMonth: eq.hoursLoggedMonth,
          Status: eq.status,
        }));
      case 'Safety Incident Report':
        return siteIncidents.map((inc) => ({
          Code: inc.incidentCode,
          DateTime: inc.dateTime,
          Category: inc.category,
          Severity: inc.severity,
          WorkArea: inc.workArea,
          Status: inc.status,
        }));
      case 'Site Expense Report':
        return siteExpenses.map((ex) => ({
          Code: ex.expenseCode,
          Date: ex.date,
          Category: ex.category,
          Title: ex.title,
          Amount: formatInr(ex.amountInr),
          Status: ex.status,
        }));
      case 'Contractor Work Report':
        return siteContractors.map((c) => ({
          Contractor: c.companyName,
          WorkCategory: c.workCategory,
          Headcount: `${c.presentToday}/${c.workforceCount}`,
          Completion: `${c.completionPct}%`,
          Compliance: c.complianceStatus,
        }));
      case 'Delayed Activity Report':
        return siteActivities
          .filter((w) => w.status === 'Delayed')
          .map((w) => ({
            Category: w.category,
            Activity: w.name,
            PlannedPct: `${w.plannedProgressPct}%`,
            ActualPct: `${w.progressPct}%`,
            Remarks: w.remarks,
          }));
    }
  }, [
    selectedReport,
    siteDailyReports,
    siteAttendance,
    siteEmployees,
    siteActivities,
    siteReceipts,
    siteInventory,
    siteConsumption,
    siteEquipment,
    siteIncidents,
    siteExpenses,
    siteContractors,
  ]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [rows, search]);

  const headers = filteredRows.length > 0 ? Object.keys(filteredRows[0]) : [];

  const handleExport = () => {
    if (!filteredRows.length) {
      toast.error('No records available to export.');
      return;
    }
    exportToCsv(`${activeSite.code}_${selectedReport.toLowerCase().replace(/\s+/g, '_')}`, filteredRows);
    toast.success(`Exported ${selectedReport} CSV`);
  };

  return (
    <div>
      <PageHeader
        title="Site Reports"
        description={`Generate and export site-scoped operational reports for ${activeSite.name}. Payroll and company-wide financials are excluded.`}
        breadcrumbs={[{ label: 'Site Workspace', to: '/' }, { label: 'Site Reports' }]}
        secondaryActions={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        }
        primaryAction={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Report Selector List */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-1 self-start">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            Available Reports (12)
          </div>
          {REPORT_TYPES.map((rep) => (
            <button
              key={rep}
              type="button"
              onClick={() => setSelectedReport(rep)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors',
                selectedReport === rep
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                  : 'text-[#172B4D] hover:bg-[#F5F7FA]'
              )}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{rep}</span>
            </button>
          ))}
        </div>

        {/* Report Preview Area */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-[#64748B]">
                BuildFlow Site Report · {activeSite.code} · {activeSite.location}
              </div>
              <h2 className="text-base font-bold text-[#172B4D] font-display">{selectedReport}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg"
              />
              <span className="text-[#64748B]">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg"
              />
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rows..."
                  className="pl-8 pr-2.5 py-1.5 border border-[#E2E8F0] rounded-lg w-40"
                />
              </div>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#64748B]">
              No records found for "{selectedReport}" on {activeSite.name}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                    {headers.map((h) => (
                      <th key={h} className="py-2.5 px-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F5F7FA]/60">
                      {headers.map((h) => (
                        <td key={h} className="py-3 px-4 text-[#172B4D] tabular-nums">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
