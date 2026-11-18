import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Download,
  Info,
  MapPin,
  Radio,
  Search,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Drawer, Modal } from '../../components/common/Modal';
import { AttendanceException, AttendanceSession } from '../../types/domain';
import { exportToCsv } from '../../utils/csv';
import { cn, getInitials } from '../../utils/format';

export const AttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'tracking' ? 'tracking' : 'register';
  const initialFilter = searchParams.get('filter') ?? 'ALL';

  const { activeSite, siteAttendance, siteExceptions } = useSiteContext();
  const reviewAttendanceException = useBuildFlowStore((s) => s.reviewAttendanceException);

  const [activeTab, setActiveTab] = useState<'register' | 'tracking' | 'corrections'>(initialTab);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [trackingStatusFilter, setTrackingStatusFilter] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [reviewException, setReviewException] = useState<AttendanceException | null>(null);
  const [decisionRemark, setDecisionRemark] = useState('');

  const stats = activeSite.workforceStats;

  const filteredSessions = useMemo(() => {
    return siteAttendance.filter((s) => {
      if (statusFilter === 'OnSite' && s.checkOutTime !== null) return false;
      if (statusFilter === 'Present' && !s.checkInTime) return false;
      if (trackingStatusFilter !== 'ALL' && s.trackingStatus !== trackingStatusFilter) return false;
      if (
        search.trim() &&
        !`${s.employeeName} ${s.employeeCode} ${s.designation} ${s.supervisorName} ${s.zoneName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [siteAttendance, statusFilter, trackingStatusFilter, search]);

  const handleExceptionDecision = (decision: 'Approved' | 'Rejected' | 'Clarification Requested') => {
    if (!reviewException) return;
    if (!decisionRemark.trim()) {
      toast.error('Please enter a decision remark for the audit trail.');
      return;
    }
    reviewAttendanceException(reviewException.id, decision, decisionRemark.trim());
    toast.success(`Correction ${decision.toLowerCase()} for ${reviewException.employeeName}`);
    setReviewException(null);
    setDecisionRemark('');
  };

  const handleExport = () => {
    exportToCsv(`${activeSite.code}_attendance_register`, filteredSessions.map((a) => ({
      EmployeeID: a.employeeCode,
      Name: a.employeeName,
      Designation: a.designation,
      CheckIn: a.checkInTime ?? '—',
      CheckOut: a.checkOutTime ?? 'Active',
      WorkingHours: a.workingHours,
      Method: a.method,
      GPS: a.gpsVerification,
      Selfie: a.selfieVerification,
      ApprovalStatus: a.approvalStatus,
    })));
    toast.success('Attendance register CSV downloaded');
  };

  return (
    <div>
      <PageHeader
        title="Attendance & Site Tracking"
        description={`Verify daily check-ins, selfies, geofence status, and correction requests for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Workforce', to: '/' }, { label: 'Attendance & Tracking' }]}
        primaryAction={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export Attendance CSV
          </button>
        }
      />

      {/* Attendance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Present', value: stats.present, tone: 'text-[#16A34A]' },
          { label: 'Absent', value: stats.absent, tone: 'text-[#DC2626]' },
          { label: 'Late', value: stats.late, tone: 'text-[#D97706]' },
          { label: 'On Leave', value: stats.onLeave, tone: 'text-[#2563EB]' },
          { label: 'Active Tracking', value: stats.activeTracking, tone: 'text-[#172B4D]' },
          { label: 'Corrections Pending', value: siteExceptions.filter((e) => e.status === 'Pending').length, tone: 'text-[#D97706]' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
            <div className="text-[11px] text-[#64748B]">{item.label}</div>
            <div className={cn('text-xl font-bold font-display tabular-nums mt-0.5', item.tone)}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold',
              activeTab === 'register' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            Attendance Register ({siteAttendance.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5',
              activeTab === 'tracking' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            Site Geofence View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('corrections')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold',
              activeTab === 'corrections' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B]'
            )}
          >
            Corrections ({siteExceptions.filter((e) => e.status === 'Pending').length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter employee or zone..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            />
          </div>
          {activeTab === 'tracking' ? (
            <select
              value={trackingStatusFilter}
              onChange={(e) => setTrackingStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Tracking States</option>
              <option value="Active">Active</option>
              <option value="Stale Location">Stale Location</option>
              <option value="Checked Out">Checked Out (Stopped)</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Records</option>
              <option value="OnSite">Currently On Site</option>
              <option value="Present">Checked In Today</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: ATTENDANCE REGISTER */}
      {activeTab === 'register' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Check-in / Out</th>
                  <th className="py-3 px-3">Hours</th>
                  <th className="py-3 px-3">Method & GPS</th>
                  <th className="py-3 px-3">Selfie</th>
                  <th className="py-3 px-3">Approval</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredSessions.map((sess) => (
                  <tr
                    key={sess.id}
                    onClick={() => setSelectedSession(sess)}
                    className="hover:bg-[#F5F7FA]/70 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172B4D]">{sess.employeeName}</div>
                      <div className="text-[11px] text-[#64748B]">
                        <span className="font-mono">{sess.employeeCode}</span> · {sess.designation}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#172B4D]">
                      <div>In: {sess.checkInTime ?? '—'}</div>
                      <div className="text-[11px] text-[#64748B]">Out: {sess.checkOutTime ?? 'Active'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#172B4D]">{sess.workingHours.toFixed(1)}h</td>
                    <td className="py-3 px-3">
                      <div className="text-[#172B4D]">{sess.method}</div>
                      <div className="text-[11px] text-[#64748B]">{sess.gpsVerification}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge label={sess.selfieVerification} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge label={sess.approvalStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(sess);
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[#E2E8F0]">
            {filteredSessions.map((sess) => (
              <button
                key={sess.id}
                type="button"
                onClick={() => setSelectedSession(sess)}
                className="w-full p-4 text-left space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#172B4D]">{sess.employeeName}</span>
                  <StatusBadge label={sess.approvalStatus} />
                </div>
                <div className="text-xs text-[#64748B] font-mono tabular-nums">
                  In: {sess.checkInTime ?? '—'} · Out: {sess.checkOutTime ?? 'On Site'} · {sess.gpsVerification}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SIMULATED GEOFENCE & ZONE TRACKING VIEW */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Simulated Site Zone View (Prototype Demo Data):</strong> Live GPS positions are not fabricated here. Real device coordinates appear only when mobile app background telemetry is connected. Per BuildFlow privacy rules, tracking stops automatically upon check-out and stale/offline sessions are clearly marked.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Interactive Site Geofence Schematic */}
            <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D] font-display">
                    {activeSite.geofence.polygonLabel}
                  </h3>
                  <div className="text-[11px] text-[#64748B] font-mono">
                    Geofence Radius: {activeSite.geofence.radiusMeters}m · Ref: {activeSite.geofence.centerLat.toFixed(4)}°N, {activeSite.geofence.centerLng.toFixed(4)}°E
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-[#64748B] border border-[#E2E8F0]">
                  Simulated Zones
                </span>
              </div>

              <div className="relative w-full aspect-[16/10] bg-[#0F1F35] rounded-xl overflow-hidden border border-slate-700">
                {/* Architectural Grid Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="siteGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#94A3B8" strokeWidth="0.6" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#siteGrid)" />
                  <rect x="4%" y="6%" width="92%" height="88%" rx="14" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="6 4" />
                </svg>

                {/* Authorized Work Zones */}
                {activeSite.geofence.zones.map((z) => (
                  <div
                    key={z.id}
                    style={{
                      left: `${z.xPct}%`,
                      top: `${z.yPct}%`,
                      width: `${z.wPct}%`,
                      height: `${z.hPct}%`,
                      borderColor: z.color,
                    }}
                    className="absolute rounded-lg border bg-white/5 p-2 flex items-start justify-between"
                  >
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-200 leading-tight">
                      {z.name}
                    </span>
                  </div>
                ))}

                {/* Simulated Employee Zone Pins */}
                {filteredSessions.map((sess) => {
                  const isCheckedOut = sess.trackingStatus === 'Checked Out';
                  const isStale = sess.trackingStatus === 'Stale Location';
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => setSelectedSession(sess)}
                      style={{ left: `${sess.simX}%`, top: `${sess.simY}%` }}
                      title={`${sess.employeeName} (${sess.trackingStatus})`}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 group flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold shadow-lg border transition-transform hover:scale-105',
                        isCheckedOut
                          ? 'bg-slate-700 text-slate-300 border-slate-500 opacity-75'
                          : isStale
                          ? 'bg-amber-600 text-white border-amber-300'
                          : 'bg-[#2563EB] text-white border-blue-300'
                      )}
                    >
                      <span>{getInitials(sess.employeeName)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#2563EB]" /> Active Session (Inside Geofence)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-600" /> Stale / Offline Update
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-600" /> Checked Out (Tracking Stopped)
                </span>
              </div>
            </div>

            {/* Live Session List */}
            <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-3.5 border-b border-[#E2E8F0] font-semibold text-sm text-[#172B4D] font-display">
                Active & Recent Sessions ({filteredSessions.length})
              </div>
              <div className="divide-y divide-[#E2E8F0] overflow-y-auto max-h-[420px]">
                {filteredSessions.map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => setSelectedSession(sess)}
                    className="w-full px-4 py-3 text-left hover:bg-[#F5F7FA] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#172B4D] truncate">
                        {sess.employeeName}{' '}
                        <span className="font-normal text-[#64748B]">· {sess.designation}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {sess.zoneName} · {sess.lastLocationUpdate}
                      </div>
                    </div>
                    <StatusBadge label={sess.trackingStatus} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE CORRECTIONS */}
      {activeTab === 'corrections' && (
        <div className="space-y-3">
          {siteExceptions.map((exc) => (
            <div key={exc.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#172B4D]">{exc.employeeName}</span>
                    <span className="font-mono text-xs text-[#64748B]">{exc.employeeCode}</span>
                    <StatusBadge label={exc.exceptionType} tone="warning" />
                    <StatusBadge label={exc.status} />
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    Date: <span className="font-mono">{exc.date}</span> · Requested Time:{' '}
                    <strong className="text-[#172B4D] font-mono">{exc.requestedTime}</strong> · Submitted by {exc.submittedBy}
                  </div>
                </div>
                {exc.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewException(exc);
                      setDecisionRemark('');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 shrink-0"
                  >
                    Review Correction
                  </button>
                )}
              </div>
              <p className="text-xs text-[#172B4D] bg-[#F5F7FA] p-3 rounded-lg border border-[#E2E8F0]">
                {exc.reason}
              </p>
              <div className="text-[11px] text-[#64748B] space-y-1">
                {exc.auditHistory.map((h, i) => (
                  <div key={i}>
                    <span className="font-mono">{h.timestamp}</span> — <strong>{h.actor}</strong>: {h.action} ({h.remark})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Session Verification Drawer */}
      <Drawer
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.employeeName ?? ''}
        subtitle={selectedSession ? `${selectedSession.employeeCode} · ${selectedSession.designation}` : ''}
      >
        {selectedSession && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] grid grid-cols-2 gap-3">
              <div>
                <div className="text-[#64748B]">Check-in</div>
                <div className="font-mono font-semibold text-[#172B4D] mt-0.5">
                  {selectedSession.checkInTime ?? '—'}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Check-out</div>
                <div className="font-mono font-semibold text-[#172B4D] mt-0.5">
                  {selectedSession.checkOutTime ?? 'Active on site'}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Method</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{selectedSession.method}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Geofence Status</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{selectedSession.gpsVerification}</div>
              </div>
            </div>

            {selectedSession.offlineCapturedAt && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-950">
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Offline Timestamp Preserved:</strong> Captured at{' '}
                  <span className="font-mono">{selectedSession.offlineCapturedAt}</span> while device lacked connectivity.
                </div>
              </div>
            )}

            <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-2">
              <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#2563EB]" />
                Check-in Selfie & Verification
              </div>
              <div className="p-4 rounded-lg bg-[#101F35] text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold">Biometric / Selfie Check</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Status: {selectedSession.selfieVerification} · Zone: {selectedSession.zoneName}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
              <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                Tracking Session State
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Status:</span>
                <StatusBadge label={selectedSession.trackingStatus} />
              </div>
              <div className="text-[#64748B]">Last update: {selectedSession.lastLocationUpdate}</div>
              {selectedSession.accuracyMeters && (
                <div className="text-[#64748B] font-mono">
                  Simulated accuracy radius: ±{selectedSession.accuracyMeters}m
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Review Correction Modal */}
      <Modal
        open={Boolean(reviewException)}
        onClose={() => setReviewException(null)}
        title="Review Attendance Correction"
        subtitle={
          reviewException
            ? `${reviewException.employeeName} · ${reviewException.exceptionType} (${reviewException.date})`
            : ''
        }
      >
        {reviewException && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg space-y-1">
              <div>
                <strong>Requested Time:</strong> <span className="font-mono">{reviewException.requestedTime}</span>
              </div>
              <div>
                <strong>Reason:</strong> {reviewException.reason}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">
                Decision Remarks (Required for Audit Trail)
              </label>
              <textarea
                rows={3}
                value={decisionRemark}
                onChange={(e) => setDecisionRemark(e.target.value)}
                placeholder="e.g., Cross-checked with site security gate register..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleExceptionDecision('Clarification Requested')}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#172B4D] font-medium"
              >
                Request More Info
              </button>
              <button
                type="button"
                onClick={() => handleExceptionDecision('Rejected')}
                className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white font-semibold"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleExceptionDecision('Approved')}
                className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white font-semibold"
              >
                Approve Correction
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
