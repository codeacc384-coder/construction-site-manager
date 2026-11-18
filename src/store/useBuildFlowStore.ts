import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ActivityEvent,
  AppNotification,
  AttendanceException,
  AttendanceSession,
  Contractor,
  DailySiteReport,
  Employee,
  EquipmentAsset,
  EquipmentStatus,
  InventoryItem,
  InventoryTransaction,
  LeaveRequest,
  MaterialConsumptionRecord,
  MaterialReceipt,
  OvertimeRequest,
  PurchaseRequest,
  SafetyIncident,
  SafetyInspection,
  ShiftDefinition,
  Site,
  SiteDocument,
  SiteExpense,
  SiteId,
  SiteManagerProfile,
  SiteTask,
  TaskStatus,
  WorkActivity,
} from '../types/domain';
import { INITIAL_MANAGER_PROFILE, INITIAL_SITES, ORG_ID } from '../mock-data/sites';
import {
  INITIAL_ATTENDANCE_EXCEPTIONS,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_OVERTIME_REQUESTS,
  INITIAL_SHIFTS,
} from '../mock-data/workforce';
import {
  INITIAL_ACTIVITY_EVENTS,
  INITIAL_DAILY_REPORTS,
  INITIAL_TASKS,
  INITIAL_WORK_ACTIVITIES,
} from '../mock-data/operations';
import {
  INITIAL_CONSUMPTION,
  INITIAL_CONTRACTORS,
  INITIAL_EQUIPMENT,
  INITIAL_EXPENSES,
  INITIAL_INVENTORY,
  INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_MATERIAL_RECEIPTS,
  INITIAL_PURCHASE_REQUESTS,
} from '../mock-data/materialsAndAssets';
import {
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SAFETY_INCIDENTS,
  INITIAL_SAFETY_INSPECTIONS,
} from '../mock-data/safetyDocsNotifs';

interface BuildFlowState {
  activeSiteId: SiteId;
  globalSearch: string;
  mobileDrawerOpen: boolean;
  sites: Site[];
  managerProfile: SiteManagerProfile;
  employees: Employee[];
  attendanceSessions: AttendanceSession[];
  attendanceExceptions: AttendanceException[];
  tasks: SiteTask[];
  dailyReports: DailySiteReport[];
  workActivities: WorkActivity[];
  shifts: ShiftDefinition[];
  leaveRequests: LeaveRequest[];
  overtimeRequests: OvertimeRequest[];
  purchaseRequests: PurchaseRequest[];
  materialReceipts: MaterialReceipt[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  consumptionRecords: MaterialConsumptionRecord[];
  equipment: EquipmentAsset[];
  contractors: Contractor[];
  expenses: SiteExpense[];
  safetyIncidents: SafetyIncident[];
  safetyInspections: SafetyInspection[];
  documents: SiteDocument[];
  notifications: AppNotification[];
  activityEvents: ActivityEvent[];

  // Navigation / shell actions
  setActiveSiteId: (siteId: SiteId) => void;
  setGlobalSearch: (query: string) => void;
  setMobileDrawerOpen: (open: boolean) => void;

  // Profile & Settings
  updateManagerProfile: (patch: Partial<SiteManagerProfile>) => void;
  updateSiteSettings: (siteId: SiteId, patch: Partial<Site>) => void;

  // Daily Operations
  createTask: (task: Omit<SiteTask, 'id' | 'organizationId'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, remarks?: string) => void;
  createDailyReport: (report: Omit<DailySiteReport, 'id' | 'organizationId' | 'amendments'>) => void;
  submitDailyReport: (reportId: string) => void;
  amendDailyReport: (reportId: string, reason: string, summary: string) => void;

  // Site Progress
  updateWorkProgress: (activityId: string, addedQuantity: number, remarks: string, evidenceLabel?: string) => { ok: boolean; message: string };

  // Workforce & Assignments
  requestEmployeeAssignment: (payload: {
    name: string;
    designation: Employee['designation'];
    department: Employee['department'];
    employmentType: Employee['employmentType'];
    workArea: string;
    supervisorId: string;
    supervisorName: string;
  }) => void;
  requestSiteTransfer: (employeeId: string, targetWorkArea: string, targetStatus: Employee['assignmentStatus']) => void;

  // Attendance Exceptions
  reviewAttendanceException: (
    exceptionId: string,
    decision: 'Approved' | 'Rejected' | 'Clarification Requested',
    remark: string
  ) => void;

  // Leave & Overtime
  reviewLeaveRequest: (id: string, decision: 'Approved' | 'Rejected' | 'Clarification Requested', remark: string) => void;
  reviewOvertimeRequest: (id: string, decision: 'Approved' | 'Rejected' | 'Escalated to Admin', remark: string) => void;

  // Procurement
  createPurchaseRequest: (pr: Omit<PurchaseRequest, 'id' | 'organizationId' | 'requestCode' | 'currentStep' | 'status'>) => void;
  reviewPurchaseRequest: (
    id: string,
    decision: 'Approved by Site Manager' | 'Forwarded to Procurement' | 'Clarification Requested' | 'Rejected',
    remark: string
  ) => void;

  // Material Receipts & Inventory
  verifyMaterialReceipt: (
    receiptId: string,
    payload: {
      receivedQuantity: number;
      damagedQuantity: number;
      status: MaterialReceipt['status'];
      remarks: string;
    }
  ) => void;
  recordInventoryAdjustment: (payload: {
    materialId: string;
    type: InventoryTransaction['type'];
    quantityDelta: number;
    destination: string;
    remarks: string;
  }) => { ok: boolean; message: string };

  // Material Consumption
  recordMaterialConsumption: (payload: {
    activityId: string;
    materialId: string;
    quantityUsed: number;
    plannedQty: number;
    remarks: string;
  }) => { ok: boolean; message: string };

  // Equipment
  updateEquipmentStatus: (equipmentId: string, status: EquipmentStatus, logNote: string, logType: string) => void;
  logEquipmentUsage: (equipmentId: string, addedHours: number) => void;

  // Contractors
  forwardContractorBill: (contractorId: string) => void;

  // Site Expenses
  createExpense: (expense: Omit<SiteExpense, 'id' | 'organizationId' | 'expenseCode' | 'status'>) => void;
  reviewExpense: (
    expenseId: string,
    decision: 'Approved by Site Manager' | 'Forwarded to Finance' | 'Rejected',
    remark: string
  ) => void;

  // Safety
  reportSafetyIncident: (incident: Omit<SafetyIncident, 'id' | 'organizationId' | 'incidentCode' | 'escalatedToAdmin' | 'status'>) => void;
  updateIncidentStatus: (incidentId: string, status: SafetyIncident['status']) => void;
  scheduleInspection: (inspection: Omit<SafetyInspection, 'id' | 'organizationId'>) => void;
  toggleChecklistItem: (inspectionId: string, itemId: string, passed: boolean) => void;

  // Documents
  uploadDocument: (doc: Omit<SiteDocument, 'id' | 'organizationId' | 'r2ObjectKey'>) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (siteId: SiteId) => void;

  // Reset
  resetDemoState: () => void;
}

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

function todayIso(): string {
  return '2026-11-18';
}

export const useBuildFlowStore = create<BuildFlowState>()(
  persist(
    (set, get) => ({
      activeSiteId: INITIAL_SITES[0].id,
      globalSearch: '',
      mobileDrawerOpen: false,
      sites: INITIAL_SITES,
      managerProfile: INITIAL_MANAGER_PROFILE,
      employees: INITIAL_EMPLOYEES,
      attendanceSessions: INITIAL_ATTENDANCE_SESSIONS,
      attendanceExceptions: INITIAL_ATTENDANCE_EXCEPTIONS,
      tasks: INITIAL_TASKS,
      dailyReports: INITIAL_DAILY_REPORTS,
      workActivities: INITIAL_WORK_ACTIVITIES,
      shifts: INITIAL_SHIFTS,
      leaveRequests: INITIAL_LEAVE_REQUESTS,
      overtimeRequests: INITIAL_OVERTIME_REQUESTS,
      purchaseRequests: INITIAL_PURCHASE_REQUESTS,
      materialReceipts: INITIAL_MATERIAL_RECEIPTS,
      inventory: INITIAL_INVENTORY,
      inventoryTransactions: INITIAL_INVENTORY_TRANSACTIONS,
      consumptionRecords: INITIAL_CONSUMPTION,
      equipment: INITIAL_EQUIPMENT,
      contractors: INITIAL_CONTRACTORS,
      expenses: INITIAL_EXPENSES,
      safetyIncidents: INITIAL_SAFETY_INCIDENTS,
      safetyInspections: INITIAL_SAFETY_INSPECTIONS,
      documents: INITIAL_DOCUMENTS,
      notifications: INITIAL_NOTIFICATIONS,
      activityEvents: INITIAL_ACTIVITY_EVENTS,

      setActiveSiteId: (siteId) => set({ activeSiteId: siteId }),
      setGlobalSearch: (globalSearch) => set({ globalSearch }),
      setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),

      updateManagerProfile: (patch) =>
        set((state) => ({
          managerProfile: { ...state.managerProfile, ...patch },
        })),

      updateSiteSettings: (siteId, patch) =>
        set((state) => ({
          sites: state.sites.map((s) => (s.id === siteId ? { ...s, ...patch } : s)),
        })),

      createTask: (task) =>
        set((state) => {
          const newTask: SiteTask = {
            ...task,
            id: `tsk-${Date.now()}`,
            organizationId: ORG_ID,
          };
          return {
            tasks: [newTask, ...state.tasks],
            activityEvents: [
              {
                id: `act-${Date.now()}`,
                siteId: task.siteId,
                time: nowTimeLabel(),
                actor: state.managerProfile.name,
                type: 'Report',
                detail: `Assigned task "${task.title}" to ${task.assignedToName}.`,
              },
              ...state.activityEvents,
            ],
          };
        }),

      updateTaskStatus: (taskId, status, remarks) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status,
                  progressPct: status === 'Completed' || status === 'Verified' ? 100 : status === 'Not Started' ? 0 : Math.max(t.progressPct, 35),
                  completionRemarks: remarks ?? t.completionRemarks,
                }
              : t
          ),
        })),

      createDailyReport: (report) =>
        set((state) => ({
          dailyReports: [
            {
              ...report,
              id: `dsr-${Date.now()}`,
              organizationId: ORG_ID,
              amendments: [],
              submittedAt: report.status === 'Submitted' ? `${report.date} ${nowTimeLabel()}` : undefined,
            },
            ...state.dailyReports,
          ],
          activityEvents: [
            {
              id: `act-${Date.now()}`,
              siteId: report.siteId,
              time: nowTimeLabel(),
              actor: report.submittedBy,
              type: 'Report',
              detail: `${report.status === 'Submitted' ? 'Submitted' : 'Saved draft'} Daily Site Diary for ${report.date}.`,
            },
            ...state.activityEvents,
          ],
        })),

      submitDailyReport: (reportId) =>
        set((state) => ({
          dailyReports: state.dailyReports.map((r) =>
            r.id === reportId ? { ...r, status: 'Submitted', submittedAt: `${r.date} ${nowTimeLabel()}` } : r
          ),
        })),

      amendDailyReport: (reportId, reason, summary) =>
        set((state) => ({
          dailyReports: state.dailyReports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  amendments: [
                    ...r.amendments,
                    {
                      id: `amd-${Date.now()}`,
                      amendedAt: `${todayIso()} ${nowTimeLabel()}`,
                      amendedBy: state.managerProfile.name,
                      reason,
                      summary,
                    },
                  ],
                }
              : r
          ),
        })),

      updateWorkProgress: (activityId, addedQuantity, remarks, evidenceLabel) => {
        const state = get();
        const act = state.workActivities.find((w) => w.id === activityId);
        if (!act) return { ok: false, message: 'Work activity not found.' };
        if (addedQuantity <= 0) return { ok: false, message: 'Added quantity must be greater than zero.' };
        const nextTotal = Math.min(act.quantityPlanned, act.quantityCompleted + addedQuantity);
        const nextPct = Math.round((nextTotal / act.quantityPlanned) * 100);
        const nextStatus: WorkActivity['status'] =
          nextPct >= 100 ? 'Completed' : nextPct < act.plannedProgressPct - 4 ? 'Delayed' : 'On Track';

        set((s) => ({
          workActivities: s.workActivities.map((w) =>
            w.id === activityId
              ? {
                  ...w,
                  quantityCompleted: nextTotal,
                  progressPct: nextPct,
                  status: nextStatus,
                  remarks,
                  actualEnd: nextPct >= 100 ? todayIso() : w.actualEnd,
                  updateHistory: [
                    {
                      id: `pu-${Date.now()}`,
                      date: todayIso(),
                      addedQuantity,
                      newTotalQuantity: nextTotal,
                      updatedBy: s.managerProfile.name,
                      remarks,
                      evidenceLabel,
                    },
                    ...w.updateHistory,
                  ],
                }
              : w
          ),
        }));
        return { ok: true, message: `Updated ${act.name} to ${nextPct}% (${nextTotal} ${act.unit}).` };
      },

      requestEmployeeAssignment: (payload) =>
        set((state) => {
          const site = state.sites.find((s) => s.id === state.activeSiteId);
          const newEmp: Employee = {
            id: `emp-${Date.now()}`,
            organizationId: ORG_ID,
            siteId: state.activeSiteId,
            empCode: `BF-${Math.floor(600 + Math.random() * 350)}`,
            name: payload.name,
            designation: payload.designation,
            department: payload.department,
            employmentType: payload.employmentType,
            supervisorId: payload.supervisorId,
            supervisorName: payload.supervisorName,
            workArea: payload.workArea,
            shiftName: 'General Shift',
            attendanceStatus: 'Not Submitted',
            assignmentStatus: 'Pending Transfer',
            joinedDate: todayIso(),
            safetyInductionDate: todayIso(),
            avatarColor: '#2563EB',
            assignmentHistory: [
              {
                id: `as-${Date.now()}`,
                employeeId: `emp-${Date.now()}`,
                siteId: state.activeSiteId,
                siteName: site?.name ?? '',
                workArea: payload.workArea,
                roleOnSite: payload.designation,
                startDate: todayIso(),
                status: 'Pending Transfer',
                approvedBy: 'Pending Admin Policy Check',
              },
            ],
            documents: [],
          };
          return {
            employees: [newEmp, ...state.employees],
          };
        }),

      requestSiteTransfer: (employeeId, targetWorkArea, targetStatus) =>
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === employeeId
              ? {
                  ...e,
                  workArea: targetWorkArea,
                  assignmentStatus: targetStatus,
                  assignmentHistory: [
                    ...e.assignmentHistory.map((h) => (h.status === 'Active' ? { ...h, endDate: todayIso(), status: 'Released' as const } : h)),
                    {
                      id: `as-${Date.now()}`,
                      employeeId,
                      siteId: e.siteId,
                      siteName: state.sites.find((s) => s.id === e.siteId)?.name ?? '',
                      workArea: targetWorkArea,
                      roleOnSite: e.designation,
                      startDate: todayIso(),
                      status: targetStatus,
                      approvedBy: state.managerProfile.name,
                    },
                  ],
                }
              : e
          ),
        })),

      reviewAttendanceException: (exceptionId, decision, remark) =>
        set((state) => ({
          attendanceExceptions: state.attendanceExceptions.map((exc) =>
            exc.id === exceptionId
              ? {
                  ...exc,
                  status: decision,
                  auditHistory: [
                    ...exc.auditHistory,
                    {
                      timestamp: `${todayIso()} ${nowTimeLabel()}`,
                      actor: state.managerProfile.name,
                      action: decision,
                      remark,
                    },
                  ],
                }
              : exc
          ),
          activityEvents: [
            {
              id: `act-${Date.now()}`,
              siteId: state.activeSiteId,
              time: nowTimeLabel(),
              actor: state.managerProfile.name,
              type: 'Attendance',
              detail: `${decision} attendance correction (${exceptionId}): ${remark}`,
            },
            ...state.activityEvents,
          ],
        })),

      reviewLeaveRequest: (id, decision, remark) =>
        set((state) => ({
          leaveRequests: state.leaveRequests.map((lr) =>
            lr.id === id ? { ...lr, status: decision, decisionRemark: remark } : lr
          ),
        })),

      reviewOvertimeRequest: (id, decision, remark) =>
        set((state) => ({
          overtimeRequests: state.overtimeRequests.map((ot) =>
            ot.id === id
              ? {
                  ...ot,
                  status: decision,
                  auditTrail: [
                    ...ot.auditTrail,
                    {
                      timestamp: `${todayIso()} ${nowTimeLabel()}`,
                      actor: state.managerProfile.name,
                      action: decision,
                      remark,
                    },
                  ],
                }
              : ot
          ),
        })),

      createPurchaseRequest: (pr) =>
        set((state) => {
          const code = `PR-${state.activeSiteId.split('-')[1]?.toUpperCase() ?? 'BF'}-${Math.floor(110 + Math.random() * 800)}`;
          const newPr: PurchaseRequest = {
            ...pr,
            id: `pr-${Date.now()}`,
            organizationId: ORG_ID,
            requestCode: code,
            currentStep: 'Site Manager',
            status: 'Pending Site Manager',
          };
          return {
            purchaseRequests: [newPr, ...state.purchaseRequests],
            activityEvents: [
              {
                id: `act-${Date.now()}`,
                siteId: pr.siteId,
                time: nowTimeLabel(),
                actor: pr.requesterName,
                type: 'Procurement',
                detail: `Created Purchase Request ${code} (${pr.title}).`,
              },
              ...state.activityEvents,
            ],
          };
        }),

      reviewPurchaseRequest: (id, decision, remark) =>
        set((state) => ({
          purchaseRequests: state.purchaseRequests.map((pr) =>
            pr.id === id
              ? {
                  ...pr,
                  status: decision,
                  currentStep:
                    decision === 'Approved by Site Manager' || decision === 'Forwarded to Procurement'
                      ? 'Procurement'
                      : 'Site Manager',
                  remarks: remark,
                }
              : pr
          ),
        })),

      verifyMaterialReceipt: (receiptId, payload) =>
        set((state) => {
          const rec = state.materialReceipts.find((r) => r.id === receiptId);
          if (!rec) return state;

          const accepted = Math.max(0, payload.receivedQuantity - payload.damagedQuantity);
          const shouldIncrementStock = payload.status === 'Verified' && rec.status !== 'Verified' && accepted > 0;

          let nextInventory = state.inventory;
          let nextTransactions = state.inventoryTransactions;

          if (shouldIncrementStock) {
            const matchedInv = state.inventory.find(
              (item) =>
                item.siteId === rec.siteId &&
                (item.name.toLowerCase().includes(rec.materialName.split(' ')[0].toLowerCase()) ||
                  item.category === rec.category)
            );

            if (matchedInv) {
              const updatedQty = matchedInv.availableQuantity + accepted;
              nextInventory = state.inventory.map((item) =>
                item.id === matchedInv.id
                  ? {
                      ...item,
                      availableQuantity: updatedQty,
                      lastReceiptDate: todayIso(),
                      status:
                        updatedQty <= 0
                          ? 'Out of Stock'
                          : updatedQty < item.minimumStockLevel
                          ? 'Low Stock'
                          : 'Normal',
                    }
                  : item
              );

              nextTransactions = [
                {
                  id: `tx-${Date.now()}`,
                  organizationId: ORG_ID,
                  siteId: rec.siteId,
                  materialId: matchedInv.id,
                  materialName: matchedInv.name,
                  type: 'Material Receipt',
                  quantity: accepted,
                  unit: matchedInv.unit,
                  source: `${rec.supplier} (${rec.challanNumber})`,
                  destination: 'Site Main Stores',
                  timestamp: `${todayIso()} ${nowTimeLabel()}`,
                  submittedBy: rec.poNumber,
                  approvedBy: state.managerProfile.name,
                  remarks: `Receipt verified (${accepted} accepted, ${payload.damagedQuantity} damaged).`,
                },
                ...state.inventoryTransactions,
              ];
            }
          }

          return {
            materialReceipts: state.materialReceipts.map((r) =>
              r.id === receiptId
                ? {
                    ...r,
                    receivedQuantity: payload.receivedQuantity,
                    damagedQuantity: payload.damagedQuantity,
                    acceptedQuantity: accepted,
                    status: payload.status,
                    verifiedBy: payload.status === 'Verified' ? state.managerProfile.name : r.verifiedBy,
                    remarks: payload.remarks,
                  }
                : r
            ),
            inventory: nextInventory,
            inventoryTransactions: nextTransactions,
            activityEvents: [
              {
                id: `act-${Date.now()}`,
                siteId: rec.siteId,
                time: nowTimeLabel(),
                actor: state.managerProfile.name,
                type: 'Material',
                detail: `${payload.status} delivery ${rec.poNumber} (${accepted} ${rec.unit} accepted).`,
              },
              ...state.activityEvents,
            ],
          };
        }),

      recordInventoryAdjustment: (payload) => {
        const state = get();
        const item = state.inventory.find((i) => i.id === payload.materialId);
        if (!item) return { ok: false, message: 'Material inventory record not found.' };

        const nextQty = item.availableQuantity + payload.quantityDelta;
        if (nextQty < 0) return { ok: false, message: 'Insufficient available stock for this issue/adjustment.' };

        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  availableQuantity: nextQty,
                  status: nextQty <= 0 ? 'Out of Stock' : nextQty < i.minimumStockLevel ? 'Low Stock' : 'Normal',
                }
              : i
          ),
          inventoryTransactions: [
            {
              id: `tx-${Date.now()}`,
              organizationId: ORG_ID,
              siteId: item.siteId,
              materialId: item.id,
              materialName: item.name,
              type: payload.type,
              quantity: payload.quantityDelta,
              unit: item.unit,
              source: payload.quantityDelta < 0 ? 'Site Stores' : 'Adjustment Entry',
              destination: payload.destination,
              timestamp: `${todayIso()} ${nowTimeLabel()}`,
              submittedBy: s.managerProfile.name,
              approvedBy: s.managerProfile.name,
              remarks: payload.remarks,
            },
            ...s.inventoryTransactions,
          ],
        }));

        return { ok: true, message: `Recorded ${payload.type} for ${item.name}.` };
      },

      recordMaterialConsumption: (payload) => {
        const state = get();
        const item = state.inventory.find((i) => i.id === payload.materialId);
        const activity = state.workActivities.find((w) => w.id === payload.activityId);
        if (!item || !activity) return { ok: false, message: 'Valid inventory item and work activity required.' };
        if (payload.quantityUsed <= 0) return { ok: false, message: 'Quantity used must be greater than zero.' };
        if (payload.quantityUsed > item.availableQuantity) {
          return {
            ok: false,
            message: `Cannot consume ${payload.quantityUsed} ${item.unit}; only ${item.availableQuantity} ${item.unit} available in site stores.`,
          };
        }

        const nextQty = item.availableQuantity - payload.quantityUsed;
        const varianceFlag = payload.plannedQty > 0 && payload.quantityUsed > payload.plannedQty * 1.1;

        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  availableQuantity: nextQty,
                  status: nextQty <= 0 ? 'Out of Stock' : nextQty < i.minimumStockLevel ? 'Low Stock' : 'Normal',
                }
              : i
          ),
          inventoryTransactions: [
            {
              id: `tx-${Date.now()}`,
              organizationId: ORG_ID,
              siteId: item.siteId,
              materialId: item.id,
              materialName: item.name,
              type: 'Material Consumption',
              quantity: -payload.quantityUsed,
              unit: item.unit,
              source: 'Site Stores',
              destination: `${activity.workArea} — ${activity.name}`,
              timestamp: `${todayIso()} ${nowTimeLabel()}`,
              submittedBy: s.managerProfile.name,
              approvedBy: s.managerProfile.name,
              remarks: payload.remarks,
            },
            ...s.inventoryTransactions,
          ],
          consumptionRecords: [
            {
              id: `con-rec-${Date.now()}`,
              organizationId: ORG_ID,
              siteId: item.siteId,
              activityId: activity.id,
              activityName: activity.name,
              workArea: activity.workArea,
              materialId: item.id,
              materialName: item.name,
              plannedQty: payload.plannedQty,
              quantityUsed: payload.quantityUsed,
              unit: item.unit,
              date: todayIso(),
              submittedBy: s.managerProfile.name,
              varianceFlag,
              remarks: payload.remarks,
            },
            ...s.consumptionRecords,
          ],
        }));

        return { ok: true, message: `Logged ${payload.quantityUsed} ${item.unit} consumed on ${activity.name}.` };
      },

      updateEquipmentStatus: (equipmentId, status, logNote, logType) =>
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === equipmentId
              ? {
                  ...eq,
                  status,
                  maintenanceLogs: [
                    { date: todayIso(), type: logType, description: logNote, status: status === 'Available' ? 'Resolved' : 'Logged' },
                    ...eq.maintenanceLogs,
                  ],
                }
              : eq
          ),
        })),

      logEquipmentUsage: (equipmentId, addedHours) =>
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === equipmentId ? { ...eq, hoursLoggedMonth: eq.hoursLoggedMonth + addedHours } : eq
          ),
        })),

      forwardContractorBill: (contractorId) =>
        set((state) => ({
          contractors: state.contractors.map((c) =>
            c.id === contractorId ? { ...c, latestBillStatus: 'Forwarded to Finance' } : c
          ),
        })),

      createExpense: (expense) =>
        set((state) => ({
          expenses: [
            {
              ...expense,
              id: `exp-${Date.now()}`,
              organizationId: ORG_ID,
              expenseCode: `EXP-${Math.floor(310 + Math.random() * 600)}`,
              status: 'Pending Review',
            },
            ...state.expenses,
          ],
        })),

      reviewExpense: (expenseId, decision, remark) =>
        set((state) => ({
          expenses: state.expenses.map((ex) =>
            ex.id === expenseId ? { ...ex, status: decision, remarks: remark } : ex
          ),
        })),

      reportSafetyIncident: (incident) =>
        set((state) => {
          const isCritical = incident.severity === 'Critical';
          const code = `SAF-${Math.floor(100 + Math.random() * 899)}`;
          return {
            safetyIncidents: [
              {
                ...incident,
                id: `inc-${Date.now()}`,
                organizationId: ORG_ID,
                incidentCode: code,
                escalatedToAdmin: isCritical,
                status: 'Open',
              },
              ...state.safetyIncidents,
            ],
            activityEvents: [
              {
                id: `act-${Date.now()}`,
                siteId: incident.siteId,
                time: nowTimeLabel(),
                actor: incident.reportedBy,
                type: 'Safety',
                detail: `Reported ${incident.severity} ${incident.category} (${code}) at ${incident.workArea}.`,
              },
              ...state.activityEvents,
            ],
          };
        }),

      updateIncidentStatus: (incidentId, status) =>
        set((state) => ({
          safetyIncidents: state.safetyIncidents.map((inc) =>
            inc.id === incidentId ? { ...inc, status } : inc
          ),
        })),

      scheduleInspection: (inspection) =>
        set((state) => ({
          safetyInspections: [
            { ...inspection, id: `ins-${Date.now()}`, organizationId: ORG_ID },
            ...state.safetyInspections,
          ],
        })),

      toggleChecklistItem: (inspectionId, itemId, passed) =>
        set((state) => ({
          safetyInspections: state.safetyInspections.map((ins) => {
            if (ins.id !== inspectionId) return ins;
            const nextChecklist = ins.checklist.map((c) => (c.id === itemId ? { ...c, passed } : c));
            const allChecked = nextChecklist.every((c) => c.passed !== null);
            const anyFailed = nextChecklist.some((c) => c.passed === false);
            return {
              ...ins,
              checklist: nextChecklist,
              status: allChecked ? (anyFailed ? 'Action Required' : 'Completed') : 'In Progress',
            };
          }),
        })),

      uploadDocument: (doc) =>
        set((state) => ({
          documents: [
            {
              ...doc,
              id: `doc-${Date.now()}`,
              organizationId: ORG_ID,
              r2ObjectKey: `r2://buildflow-docs/${ORG_ID}/${doc.siteId}/${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${doc.fileType.toLowerCase()}`,
            },
            ...state.documents,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: (siteId) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.siteId === siteId ? { ...n, read: true } : n)),
        })),

      resetDemoState: () =>
        set({
          activeSiteId: INITIAL_SITES[0].id,
          sites: INITIAL_SITES,
          managerProfile: INITIAL_MANAGER_PROFILE,
          employees: INITIAL_EMPLOYEES,
          attendanceSessions: INITIAL_ATTENDANCE_SESSIONS,
          attendanceExceptions: INITIAL_ATTENDANCE_EXCEPTIONS,
          tasks: INITIAL_TASKS,
          dailyReports: INITIAL_DAILY_REPORTS,
          workActivities: INITIAL_WORK_ACTIVITIES,
          shifts: INITIAL_SHIFTS,
          leaveRequests: INITIAL_LEAVE_REQUESTS,
          overtimeRequests: INITIAL_OVERTIME_REQUESTS,
          purchaseRequests: INITIAL_PURCHASE_REQUESTS,
          materialReceipts: INITIAL_MATERIAL_RECEIPTS,
          inventory: INITIAL_INVENTORY,
          inventoryTransactions: INITIAL_INVENTORY_TRANSACTIONS,
          consumptionRecords: INITIAL_CONSUMPTION,
          equipment: INITIAL_EQUIPMENT,
          contractors: INITIAL_CONTRACTORS,
          expenses: INITIAL_EXPENSES,
          safetyIncidents: INITIAL_SAFETY_INCIDENTS,
          safetyInspections: INITIAL_SAFETY_INSPECTIONS,
          documents: INITIAL_DOCUMENTS,
          notifications: INITIAL_NOTIFICATIONS,
          activityEvents: INITIAL_ACTIVITY_EVENTS,
        }),
    }),
    {
      name: 'buildflow-site-manager-v1',
    }
  )
);
