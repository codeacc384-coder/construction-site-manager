import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Lock, Search, UserPlus, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Drawer, Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Employee, EmploymentType, WorkforceCategory } from '../../types/domain';
import { cn, getInitials } from '../../utils/format';

const WORKFORCE_CATEGORIES: WorkforceCategory[] = [
  'Site Engineer',
  'Supervisor',
  'Foreman',
  'Skilled Labour',
  'Unskilled Labour',
  'Electrician',
  'Plumber',
  'Mason',
  'Carpenter',
  'Welder',
  'Painter',
  'Steel Fixer',
  'Machine Operator',
  'Driver',
  'Contractor Worker',
];

export const WorkforcePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeSite, siteEmployees, can } = useSiteContext();
  const requestEmployeeAssignment = useBuildFlowStore((s) => s.requestEmployeeAssignment);
  const requestSiteTransfer = useBuildFlowStore((s) => s.requestSiteTransfer);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [empTypeFilter, setEmpTypeFilter] = useState<string>('ALL');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [profileTab, setProfileTab] = useState<number>(0);

  const [assignModalOpen, setAssignModalOpen] = useState(searchParams.get('action') === 'register');
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState<WorkforceCategory>('Mason');
  const [newDepartment, setNewDepartment] = useState<Employee['department']>('Civil & Structural');
  const [newEmpType, setNewEmpType] = useState<EmploymentType>('Contract Payroll');
  const [newWorkArea, setNewWorkArea] = useState(activeSite.geofence.zones[0]?.name ?? 'Tower A');

  const [transferWorkArea, setTransferWorkArea] = useState('');
  const [transferStatus, setTransferStatus] = useState<Employee['assignmentStatus']>('Active');

  const supervisors = useMemo(
    () => siteEmployees.filter((e) => ['Site Engineer', 'Supervisor', 'Foreman'].includes(e.designation)),
    [siteEmployees]
  );

  const filteredEmployees = useMemo(() => {
    return siteEmployees.filter((e) => {
      if (categoryFilter !== 'ALL' && e.designation !== categoryFilter) return false;
      if (empTypeFilter !== 'ALL' && e.employmentType !== empTypeFilter) return false;
      if (
        search.trim() &&
        !`${e.name} ${e.empCode} ${e.designation} ${e.workArea} ${e.contractorName ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [siteEmployees, categoryFilter, empTypeFilter, search]);

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Worker full name is required.');
      return;
    }
    const sup = supervisors[0];
    requestEmployeeAssignment({
      name: newName.trim(),
      designation: newDesignation,
      department: newDepartment,
      employmentType: newEmpType,
      workArea: newWorkArea,
      supervisorId: sup?.id ?? 'sm-104',
      supervisorName: sup?.name ?? activeSite.siteManagerName,
    });
    toast.success(`Assignment request submitted for ${newName.trim()} (Pending policy approval)`);
    setNewName('');
    setAssignModalOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !transferWorkArea) return;
    requestSiteTransfer(selectedEmp.id, transferWorkArea, transferStatus);
    toast.success(`Updated assignment for ${selectedEmp.name}; previous assignment preserved in history.`);
    setSelectedEmp(null);
  };

  const PROFILE_TABS = [
    'Personal Info',
    'Employment',
    'Site Assignments',
    'Attendance',
    'Documents',
    'Work History',
    'Activity Log',
  ];

  return (
    <div>
      <PageHeader
        title="Site Workforce Directory"
        description={`Site-scoped workforce assigned to ${activeSite.name}. Direct employees and subcontractor workers remain clearly distinguished.`}
        breadcrumbs={[{ label: 'Workforce', to: '/' }, { label: 'Workforce Directory' }]}
        primaryAction={
          <button
            type="button"
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Request Workforce Assignment
          </button>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, trade, area..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Trades & Roles ({siteEmployees.length})</option>
              {WORKFORCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={empTypeFilter}
              onChange={(e) => setEmpTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Employment Types</option>
              <option value="Direct Permanent">Direct Permanent</option>
              <option value="Contract Payroll">Contract Payroll</option>
              <option value="Daily Wage">Daily Wage</option>
              <option value="Subcontractor">Subcontractor Worker</option>
            </select>
          </div>
        }
      />

      {filteredEmployees.length === 0 ? (
        <EmptyState
          title="No matching workers on this site"
          description="Try clearing search or trade filters, or request a new workforce assignment."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Designation & Dept</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Work Area & Supervisor</th>
                    <th className="py-3 px-3">Today Attendance</th>
                    <th className="py-3 px-3">Assignment</th>
                    <th className="py-3 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmp(emp);
                        setProfileTab(0);
                        setTransferWorkArea(emp.workArea);
                      }}
                      className="hover:bg-[#F5F7FA]/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: emp.avatarColor }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#172B4D]">{emp.name}</div>
                            <div className="text-[11px] font-mono text-[#64748B]">{emp.empCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#172B4D]">{emp.designation}</div>
                        <div className="text-[11px] text-[#64748B]">{emp.department}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[#172B4D]">{emp.employmentType}</div>
                        {emp.contractorName && (
                          <div className="text-[11px] text-amber-800 truncate max-w-[160px]">{emp.contractorName}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[#172B4D]">{emp.workArea}</div>
                        <div className="text-[11px] text-[#64748B]">Sup: {emp.supervisorName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={emp.attendanceStatus} />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={emp.assignmentStatus} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedEmp(emp);
                            setProfileTab(0);
                            setTransferWorkArea(emp.workArea);
                          }}
                          className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  setSelectedEmp(emp);
                  setProfileTab(0);
                  setTransferWorkArea(emp.workArea);
                }}
                className="w-full text-left bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: emp.avatarColor }}
                    >
                      {getInitials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#172B4D] truncate">{emp.name}</div>
                      <div className="text-xs text-[#64748B]">
                        {emp.empCode} · {emp.designation}
                      </div>
                    </div>
                  </div>
                  <StatusBadge label={emp.attendanceStatus} />
                </div>
                <div className="text-xs text-[#64748B] flex flex-wrap gap-x-3 gap-y-1">
                  <span>{emp.employmentType}</span>
                  <span>·</span>
                  <span>{emp.workArea}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Employee 7-Tab Profile Drawer */}
      <Drawer
        open={Boolean(selectedEmp)}
        onClose={() => setSelectedEmp(null)}
        title={selectedEmp?.name ?? ''}
        subtitle={
          selectedEmp
            ? `${selectedEmp.empCode} · ${selectedEmp.designation} · ${selectedEmp.employmentType}`
            : ''
        }
        widthClass="max-w-2xl"
      >
        {selectedEmp && (
          <div className="space-y-5">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#E2E8F0] no-scrollbar">
              {PROFILE_TABS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProfileTab(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
                    profileTab === i ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {profileTab === 0 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl">
                  <div>
                    <div className="text-[#64748B]">Full Name</div>
                    <div className="font-semibold text-[#172B4D] mt-0.5">{selectedEmp.name}</div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Contact Phone</div>
                    <div className="font-mono text-[#172B4D] mt-0.5">
                      {can('canViewEmployeeContacts') ? selectedEmp.phone ?? 'Not on file' : 'Restricted by Admin RBAC'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Blood Group</div>
                    <div className="font-semibold text-[#172B4D] mt-0.5">{selectedEmp.bloodGroup ?? 'Not recorded'}</div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Safety Induction Date</div>
                    <div className="font-mono text-[#172B4D] mt-0.5">{selectedEmp.safetyInductionDate}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B]">
                  <Lock className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                  <span>
                    Salary, bank account details, Aadhaar/PAN, and confidential HR disciplinary records are restricted to Company Admin & HR Payroll per BuildFlow RBAC policy.
                  </span>
                </div>
              </div>
            )}

            {profileTab === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl">
                <div>
                  <div className="text-[#64748B]">Employment Type</div>
                  <div className="font-semibold text-[#172B4D] mt-0.5">{selectedEmp.employmentType}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Department</div>
                  <div className="font-semibold text-[#172B4D] mt-0.5">{selectedEmp.department}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Reporting Supervisor</div>
                  <div className="font-semibold text-[#172B4D] mt-0.5">{selectedEmp.supervisorName}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Shift Roster</div>
                  <div className="font-semibold text-[#172B4D] mt-0.5">{selectedEmp.shiftName}</div>
                </div>
                {selectedEmp.contractorName && (
                  <div className="sm:col-span-2">
                    <div className="text-[#64748B]">Subcontractor Firm</div>
                    <div className="font-semibold text-amber-800 mt-0.5">{selectedEmp.contractorName}</div>
                  </div>
                )}
              </div>
            )}

            {profileTab === 2 && (
              <div className="space-y-4 text-xs">
                <form onSubmit={handleTransferSubmit} className="p-4 border border-[#E2E8F0] rounded-xl space-y-3">
                  <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#2563EB]" />
                    Reallocate Work Area or Request Site Release
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <select
                      value={transferWorkArea}
                      onChange={(e) => setTransferWorkArea(e.target.value)}
                      className="px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                    >
                      {activeSite.geofence.zones.map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={transferStatus}
                      onChange={(e) => setTransferStatus(e.target.value as Employee['assignmentStatus'])}
                      className="px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                    >
                      <option value="Active">Active on Site</option>
                      <option value="Temporary">Temporary Allocation</option>
                      <option value="Pending Transfer">Request Site Transfer</option>
                      <option value="Released">Request Release from Site</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                  >
                    Submit Assignment Update
                  </button>
                </form>

                <div className="space-y-2">
                  <div className="font-semibold text-[#172B4D]">Historical Site Assignments (Preserved)</div>
                  {selectedEmp.assignmentHistory.map((h) => (
                    <div key={h.id} className="p-3 border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#172B4D]">{h.siteName}</div>
                        <div className="text-[#64748B]">
                          {h.workArea} · {h.roleOnSite} · {h.startDate} → {h.endDate ?? 'Present'}
                        </div>
                      </div>
                      <StatusBadge label={h.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileTab === 3 && (
              <div className="space-y-2 text-xs">
                <div className="p-3.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <span>Today (18 Nov 2026)</span>
                  <StatusBadge label={selectedEmp.attendanceStatus} />
                </div>
                <div className="p-3.5 border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <span>17 Nov 2026 · 08:01 AM – 05:35 PM (9.5 hrs)</span>
                  <StatusBadge label="Present" />
                </div>
                <div className="p-3.5 border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <span>16 Nov 2026 · 08:04 AM – 05:30 PM (9.4 hrs)</span>
                  <StatusBadge label="Present" />
                </div>
              </div>
            )}

            {profileTab === 4 && (
              <div className="space-y-2 text-xs">
                {selectedEmp.documents.length === 0 ? (
                  <div className="p-6 text-center text-[#64748B] border border-[#E2E8F0] rounded-xl">
                    No site permits or compliance documents attached yet.
                  </div>
                ) : (
                  selectedEmp.documents.map((d) => (
                    <div key={d.id} className="p-3.5 border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#172B4D]">{d.title}</div>
                        <div className="text-[#64748B]">
                          {d.type} {d.expiry ? `· Expires ${d.expiry}` : ''}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileTab === 5 && (
              <div className="p-4 border border-[#E2E8F0] rounded-xl text-xs space-y-2">
                <div className="font-semibold text-[#172B4D]">Recent Site Work History</div>
                <p className="text-[#64748B]">
                  Joined company on <span className="font-mono">{selectedEmp.joinedDate}</span>. Assigned to{' '}
                  <strong>{selectedEmp.workArea}</strong> under {selectedEmp.supervisorName}.
                </p>
              </div>
            )}

            {profileTab === 6 && (
              <div className="p-4 border border-[#E2E8F0] rounded-xl text-xs space-y-2">
                <div className="font-semibold text-[#172B4D]">Operational Activity Log</div>
                <div className="text-[#64748B]">
                  18 Nov 2026 — Checked in for {selectedEmp.shiftName} ({selectedEmp.attendanceStatus}).
                </div>
                <div className="text-[#64748B]">
                  {selectedEmp.safetyInductionDate} — Completed mandatory site safety induction.
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Request Workforce Assignment Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Request Workforce Assignment"
        subtitle={`Assign worker to ${activeSite.name} (subject to company policy approval)`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Full Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Laxman Rao"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Trade / Designation</label>
              <select
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value as WorkforceCategory)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {WORKFORCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Department</label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value as Employee['department'])}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Civil & Structural">Civil & Structural</option>
                <option value="MEP">MEP</option>
                <option value="Finishing">Finishing</option>
                <option value="Site Supervision">Site Supervision</option>
                <option value="Plant & Machinery">Plant & Machinery</option>
                <option value="Safety & QA">Safety & QA</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Employment Type</label>
              <select
                value={newEmpType}
                onChange={(e) => setNewEmpType(e.target.value as EmploymentType)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Direct Permanent">Direct Permanent</option>
                <option value="Contract Payroll">Contract Payroll</option>
                <option value="Daily Wage">Daily Wage</option>
                <option value="Subcontractor">Subcontractor</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Work Area</label>
              <select
                value={newWorkArea}
                onChange={(e) => setNewWorkArea(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {activeSite.geofence.zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
