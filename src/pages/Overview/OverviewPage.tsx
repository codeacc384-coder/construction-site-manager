import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardPlus,
  Download,
  FilePlus2,
  MapPin,
  PackagePlus,
  Radio,
  ShieldAlert,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSiteContext } from '../../hooks/useSiteContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { exportToCsv } from '../../utils/csv';
import { cn, formatInr, getInitials } from '../../utils/format';
import { toast } from 'sonner';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeSite,
    siteAttendance,
    siteExceptions,
    siteActivities,
    siteInventory,
    siteReceipts,
    sitePurchaseRequests,
    siteEquipment,
    siteLeaveRequests,
    siteOvertimeRequests,
    siteExpenses,
    siteIncidents,
    siteActivityEvents,
    pendingApprovalCount,
    openSafetyCount,
    pendingMaterialsCount,
  } = useSiteContext();

  const stats = activeSite.workforceStats;

  const kpiCards = [
    {
      label: 'Total Assigned Workforce',
      value: stats.assigned,
      sub: `${stats.notSubmitted} muster pending`,
      tone: 'neutral' as const,
      to: '/workforce',
    },
    {
      label: 'Present Today',
      value: stats.present,
      sub: `${Math.round((stats.present / stats.assigned) * 100)}% attendance · ${stats.late} late`,
      tone: 'success' as const,
      to: '/attendance?filter=Present',
    },
    {
      label: 'Absent Today',
      value: stats.absent,
      sub: `${stats.onLeave} on approved leave`,
      tone: 'danger' as const,
      to: '/attendance?filter=Absent',
    },
    {
      label: 'Currently On Site',
      value: stats.currentlyOnSite,
      sub: `${stats.checkedOut} checked out`,
      tone: 'info' as const,
      to: '/attendance?filter=OnSite',
    },
    {
      label: 'Active Tracking Sessions',
      value: stats.activeTracking,
      sub: `${stats.staleTracking} stale / offline`,
      tone: 'info' as const,
      to: '/attendance?tab=tracking',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovalCount,
      sub: 'Assigned to Site Manager',
      tone: pendingApprovalCount > 0 ? ('warning' as const) : ('success' as const),
      to: '/approvals',
    },
    {
      label: 'Material Requests Pending',
      value: pendingMaterialsCount,
      sub: `${siteReceipts.filter((r) => r.status === 'Received Pending Verification').length} deliveries to verify`,
      tone: pendingMaterialsCount > 0 ? ('warning' as const) : ('neutral' as const),
      to: '/procurement',
    },
    {
      label: 'Safety Issues Open',
      value: openSafetyCount,
      sub: `${siteIncidents.filter((i) => i.severity === 'Critical' && i.status !== 'Closed').length} critical escalated`,
      tone: openSafetyCount > 0 ? ('danger' as const) : ('success' as const),
      to: '/safety',
    },
  ];

  // Attendance Donut Chart Data
  const missingCheckoutCount = siteAttendance.filter((a) => !a.checkOutTime && a.trackingStatus === 'Stale Location').length;
  const pendingVerificationCount = siteExceptions.filter((e) => e.status === 'Pending').length;

  const attendanceDonutData = [
    { name: 'Present (On Time)', value: stats.onTime, color: '#16A34A' },
    { name: 'Late Arrival', value: stats.late, color: '#F59E0B' },
    { name: 'Absent', value: stats.absent, color: '#DC2626' },
    { name: 'On Leave', value: stats.onLeave, color: '#2563EB' },
    { name: 'Not Submitted', value: stats.notSubmitted, color: '#94A3B8' },
  ];

  // Progress Bar Chart Data
  const progressChartData = siteActivities.map((act) => ({
    name: act.category,
    Planned: act.plannedProgressPct,
    Actual: act.progressPct,
  }));

  // Equipment Summary
  const eqSummary = {
    total: siteEquipment.length,
    available: siteEquipment.filter((e) => e.status === 'Available').length,
    inUse: siteEquipment.filter((e) => e.status === 'In Use').length,
    maintenance: siteEquipment.filter((e) => e.status === 'Under Maintenance').length,
    outOfService: siteEquipment.filter((e) => e.status === 'Out of Service').length,
  };

  // Needs Your Attention Queue
  const attentionItems = [
    ...siteExceptions
      .filter((e) => e.status === 'Pending')
      .map((e) => ({
        id: e.id,
        type: 'Attendance Correction',
        requester: `${e.employeeName} (${e.exceptionType})`,
        date: e.date,
        priority: 'High',
        status: e.status,
        route: '/attendance',
      })),
    ...siteReceipts
      .filter((r) => r.status === 'Received Pending Verification')
      .map((r) => ({
        id: r.id,
        type: 'Material Receipt',
        requester: `${r.poNumber} · ${r.materialName}`,
        date: r.deliveryDateTime.split(' ')[0],
        priority: 'High',
        status: r.status,
        route: '/receipts',
      })),
    ...sitePurchaseRequests
      .filter((p) => p.status === 'Pending Site Manager')
      .map((p) => ({
        id: p.id,
        type: 'Purchase Request',
        requester: `${p.requestCode} · ${p.requesterName} (${formatInr(p.estimatedTotal)})`,
        date: p.requestDate,
        priority: p.priority,
        status: p.status,
        route: '/procurement',
      })),
    ...siteExpenses
      .filter((ex) => ex.status === 'Pending Review')
      .map((ex) => ({
        id: ex.id,
        type: 'Site Expense',
        requester: `${ex.expenseCode} · ${ex.submittedBy} (${formatInr(ex.amountInr)})`,
        date: ex.date,
        priority: ex.amountInr > 25000 ? 'High' : 'Medium',
        status: ex.status,
        route: '/expenses',
      })),
    ...siteLeaveRequests
      .filter((l) => l.status === 'Pending')
      .map((l) => ({
        id: l.id,
        type: 'Leave Request',
        requester: `${l.employeeName} · ${l.days}d ${l.leaveType}`,
        date: l.startDate,
        priority: 'Medium',
        status: l.status,
        route: '/requests',
      })),
    ...siteOvertimeRequests
      .filter((o) => o.status === 'Pending')
      .map((o) => ({
        id: o.id,
        type: 'Overtime Request',
        requester: `${o.employeeName} · ${o.requestedHours} hrs`,
        date: o.date,
        priority: o.requiresHigherApproval ? 'High' : 'Medium',
        status: o.status,
        route: '/requests',
      })),
    ...siteIncidents
      .filter((i) => i.status === 'Open')
      .map((i) => ({
        id: i.id,
        type: 'Safety Incident',
        requester: `${i.incidentCode} · ${i.category} (${i.workArea})`,
        date: i.dateTime.split(' ')[0],
        priority: i.severity,
        status: i.status,
        route: '/safety',
      })),
  ];

  const handleDownloadAttendance = () => {
    exportToCsv(`${activeSite.code}_attendance_2026-11-18`, siteAttendance.map((a) => ({
      EmployeeID: a.employeeCode,
      Name: a.employeeName,
      Designation: a.designation,
      WorkArea: a.workArea,
      CheckIn: a.checkInTime ?? '—',
      CheckOut: a.checkOutTime ?? 'Active',
      Method: a.method,
      GPSStatus: a.gpsVerification,
      TrackingStatus: a.trackingStatus,
      ApprovalStatus: a.approvalStatus,
    })));
    toast.success(`Downloaded attendance report for ${activeSite.name}`);
  };

  return (
    <div className="space-y-6">
      {/* A. Welcome & Quick Actions Banner */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span>18 November 2026</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#172B4D]">{activeSite.code}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                {activeSite.location}
              </span>
              <span aria-hidden="true">·</span>
              <StatusBadge label={activeSite.operatingStatus} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172B4D] font-display tracking-tight">
              Good Morning, Site Manager
            </h1>
            <p className="text-sm text-[#64748B]">
              Daily operational view for <strong className="text-[#172B4D] font-semibold">{activeSite.name}</strong>. Weather conditions are logged manually inside the Daily Site Diary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/daily-operations?action=new-report')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <ClipboardPlus className="w-3.5 h-3.5" />
              Add Daily Report
            </button>
            <button
              type="button"
              onClick={() => navigate('/workforce?action=register')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA] transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#2563EB]" />
              Register Workforce
            </button>
            <button
              type="button"
              onClick={() => navigate('/receipts?action=verify')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA] transition-colors whitespace-nowrap"
            >
              <PackagePlus className="w-3.5 h-3.5 text-[#16A34A]" />
              Record Material Receipt
            </button>
            <button
              type="button"
              onClick={() => navigate('/safety?action=report')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA] transition-colors whitespace-nowrap"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
              Report Site Issue
            </button>
            <button
              type="button"
              onClick={() => navigate('/procurement?action=new')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA] transition-colors whitespace-nowrap"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-[#D97706]" />
              Create Purchase Request
            </button>
          </div>
        </div>
      </section>

      {/* B. 8 Key Operational KPI Cards */}
      <section aria-label="Key Operational KPIs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => navigate(kpi.to)}
              className="group text-left bg-white border border-[#E2E8F0] hover:border-[#2563EB]/50 rounded-xl p-4 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#64748B] truncate">{kpi.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] shrink-0 transition-colors" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#172B4D] font-display tabular-nums">
                  {kpi.value}
                </span>
                <StatusBadge
                  label={
                    kpi.tone === 'success'
                      ? 'Nominal'
                      : kpi.tone === 'warning'
                      ? 'Action'
                      : kpi.tone === 'danger'
                      ? 'Alert'
                      : 'Active'
                  }
                  tone={kpi.tone}
                />
              </div>
              <div className="mt-1.5 text-xs text-[#64748B] truncate tabular-nums">{kpi.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* H. Needs Your Attention + C. Workforce Attendance Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Needs Your Attention */}
        <section className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#172B4D] font-display">Needs Your Attention</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Site-scoped requests, verifications, and safety items waiting for your action
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/approvals')}
              className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0"
            >
              Open Approval Centre
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0] flex-1">
            {attentionItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                All operational requests for {activeSite.name} are cleared.
              </div>
            ) : (
              attentionItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#F5F7FA]/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#172B4D]">{item.type}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-[#64748B] tabular-nums">{item.date}</span>
                    </div>
                    <div className="text-xs text-[#64748B] truncate mt-0.5">{item.requester}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge label={item.priority} />
                    <StatusBadge label={item.status} />
                    <button
                      type="button"
                      onClick={() => navigate(item.route)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* C. Workforce Attendance Summary */}
        <section className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#172B4D] font-display">Attendance Summary</h2>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                {stats.assigned} assigned workers · 18 Nov 2026
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadAttendance}
                title="Download Attendance CSV"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/attendance')}
                className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
              >
                View Attendance
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col sm:flex-row items-center gap-5 flex-1">
            <div className="w-44 h-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceDonutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {attendanceDonutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value ?? 0} workers`, 'Headcount']}
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-[#172B4D] font-display tabular-nums">
                  {Math.round((stats.present / stats.assigned) * 100)}%
                </span>
                <span className="text-[11px] text-[#64748B]">Present</span>
              </div>
            </div>

            <div className="w-full space-y-2 text-xs tabular-nums">
              {[
                { label: 'Present (On Time)', value: stats.onTime, color: 'bg-[#16A34A]' },
                { label: 'Late Arrival', value: stats.late, color: 'bg-[#F59E0B]' },
                { label: 'Absent', value: stats.absent, color: 'bg-[#DC2626]' },
                { label: 'On Leave', value: stats.onLeave, color: 'bg-[#2563EB]' },
                { label: 'Missing / Stale Check-out', value: missingCheckoutCount, color: 'bg-amber-700' },
                { label: 'Pending Verification', value: pendingVerificationCount, color: 'bg-slate-400' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="flex items-center gap-2 text-[#64748B]">
                    <span className={cn('w-2.5 h-2.5 rounded-sm shrink-0', row.color)} />
                    <span>{row.label}</span>
                  </span>
                  <span className="font-semibold text-[#172B4D] font-mono">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* D. Live Site Workforce + E. Site Progress Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Live Site Workforce */}
        <section className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172B4D] font-display">Site Workforce Check-in & Tracking</h2>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Simulated Telemetry
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Last-known zone updates from active work sessions (tracking stops automatically on check-out)
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/attendance?tab=tracking')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline shrink-0"
            >
              <Radio className="w-3.5 h-3.5" />
              Open Geofence Map
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Check-in</th>
                  <th className="py-2.5 px-3">Tracking</th>
                  <th className="py-2.5 px-4">Last Location Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {siteAttendance.slice(0, 6).map((row) => (
                  <tr key={row.id} className="hover:bg-[#F5F7FA]/60">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#101F35] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(row.employeeName)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#172B4D]">{row.employeeName}</div>
                          <div className="text-[11px] font-mono text-[#64748B]">{row.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B]">{row.designation}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[#172B4D]">{row.checkInTime ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge label={row.trackingStatus} />
                    </td>
                    <td className="py-2.5 px-4 text-[#64748B]">
                      <div className="text-[#172B4D]">{row.zoneName}</div>
                      <div className="text-[11px]">{row.lastLocationUpdate}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-[#E2E8F0]">
            {siteAttendance.slice(0, 5).map((row) => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[#101F35] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {getInitials(row.employeeName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#172B4D] truncate">{row.employeeName}</div>
                      <div className="text-[11px] text-[#64748B]">{row.designation} · {row.checkInTime}</div>
                    </div>
                  </div>
                  <StatusBadge label={row.trackingStatus} />
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {row.zoneName} · {row.lastLocationUpdate}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* E. Site Progress Overview */}
        <section className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#172B4D] font-display">Site Progress Overview</h2>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                Overall {activeSite.overallProgress}% actual vs {activeSite.plannedProgress}% planned
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/site-progress')}
              className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0"
            >
              View Site Progress
            </button>
          </div>

          <div className="p-5 space-y-4 flex-1">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressChartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="Planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 pt-1">
              {siteActivities.slice(0, 5).map((act) => (
                <div key={act.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#172B4D] truncate pr-2">{act.category}</span>
                    <span className="font-mono tabular-nums text-[#64748B] shrink-0">
                      {act.progressPct}% <span className="text-[11px]">({act.status})</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* F. Materials & Inventory + G. Equipment + I. Recent Site Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* F. Materials & Inventory */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#172B4D] font-display">Materials & Inventory</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Manage Stock
            </button>
          </div>
          <div className="px-5 py-3 bg-[#F5F7FA] border-b border-[#E2E8F0] grid grid-cols-3 gap-2 text-center text-xs tabular-nums">
            <div>
              <div className="font-bold text-[#172B4D] font-mono">{siteInventory.length}</div>
              <div className="text-[11px] text-[#64748B]">Tracked SKUs</div>
            </div>
            <div>
              <div className="font-bold text-[#DC2626] font-mono">
                {siteInventory.filter((i) => i.status !== 'Normal').length}
              </div>
              <div className="text-[11px] text-[#64748B]">Low / Out</div>
            </div>
            <div>
              <div className="font-bold text-[#D97706] font-mono">
                {siteReceipts.filter((r) => r.status === 'Received Pending Verification').length}
              </div>
              <div className="text-[11px] text-[#64748B]">Pending GRN</div>
            </div>
          </div>
          <div className="divide-y divide-[#E2E8F0] flex-1">
            {siteInventory.slice(0, 5).map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-medium text-[#172B4D] truncate">{item.name}</div>
                  <div className="text-[11px] text-[#64748B] font-mono tabular-nums">
                    {item.availableQuantity} {item.unit}
                  </div>
                </div>
                <StatusBadge label={item.status} />
              </div>
            ))}
          </div>
        </section>

        {/* G. Equipment & Machinery */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-sm font-bold text-[#172B4D] font-display">Equipment & Machinery</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/equipment')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              View Fleet
            </button>
          </div>
          <div className="px-5 py-3 bg-[#F5F7FA] border-b border-[#E2E8F0] grid grid-cols-4 gap-1 text-center text-xs tabular-nums">
            <div>
              <div className="font-bold text-[#172B4D] font-mono">{eqSummary.total}</div>
              <div className="text-[10px] text-[#64748B]">Total</div>
            </div>
            <div>
              <div className="font-bold text-[#2563EB] font-mono">{eqSummary.inUse}</div>
              <div className="text-[10px] text-[#64748B]">In Use</div>
            </div>
            <div>
              <div className="font-bold text-[#16A34A] font-mono">{eqSummary.available}</div>
              <div className="text-[10px] text-[#64748B]">Avail</div>
            </div>
            <div>
              <div className="font-bold text-[#DC2626] font-mono">
                {eqSummary.maintenance + eqSummary.outOfService}
              </div>
              <div className="text-[10px] text-[#64748B]">Down</div>
            </div>
          </div>
          <div className="divide-y divide-[#E2E8F0] flex-1">
            {siteEquipment.slice(0, 5).map((eq) => (
              <div key={eq.id} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-medium text-[#172B4D] truncate">{eq.name}</div>
                  <div className="text-[11px] text-[#64748B] truncate">
                    {eq.assetCode} · {eq.assignedOperator}
                  </div>
                </div>
                <StatusBadge label={eq.status} />
              </div>
            ))}
          </div>
        </section>

        {/* I. Recent Site Activity */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#16A34A]" />
              <h2 className="text-sm font-bold text-[#172B4D] font-display">Recent Site Activity</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/daily-operations')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Daily Log
            </button>
          </div>
          <div className="p-5 space-y-4 flex-1">
            {siteActivityEvents.slice(0, 6).map((evt) => (
              <div key={evt.id} className="flex gap-3 text-xs">
                <span className="font-mono text-[11px] text-[#64748B] w-16 shrink-0 tabular-nums pt-0.5">
                  {evt.time}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-[#172B4D]">
                    {evt.actor} <span className="text-[#64748B] font-normal">· {evt.type}</span>
                  </div>
                  <p className="text-[#64748B] mt-0.5 leading-relaxed">{evt.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
