import {
  AttendanceException,
  AttendanceSession,
  Contractor,
  DailySiteReport,
  Employee,
  EquipmentAsset,
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
  WorkActivity,
} from '../types/domain';

/**
 * Modular Service Interface ready for future Supabase / PostgreSQL RLS integration.
 * Every query is strictly scoped by `siteId` (and `organizationId` at the backend RLS layer).
 */
export interface SiteOperationsService {
  getAuthorizedSites(managerId: string): Promise<Site[]>;
  getManagerProfile(managerId: string): Promise<SiteManagerProfile>;
  getSiteWorkforce(siteId: SiteId): Promise<Employee[]>;
  getSiteAttendance(siteId: SiteId, date: string): Promise<AttendanceSession[]>;
  getAttendanceExceptions(siteId: SiteId): Promise<AttendanceException[]>;
  getSiteTasks(siteId: SiteId): Promise<SiteTask[]>;
  getDailyReports(siteId: SiteId): Promise<DailySiteReport[]>;
  getWorkActivities(siteId: SiteId): Promise<WorkActivity[]>;
  getShifts(siteId: SiteId): Promise<ShiftDefinition[]>;
  getLeaveRequests(siteId: SiteId): Promise<LeaveRequest[]>;
  getOvertimeRequests(siteId: SiteId): Promise<OvertimeRequest[]>;
  getPurchaseRequests(siteId: SiteId): Promise<PurchaseRequest[]>;
  getMaterialReceipts(siteId: SiteId): Promise<MaterialReceipt[]>;
  getInventory(siteId: SiteId): Promise<InventoryItem[]>;
  getInventoryTransactions(siteId: SiteId): Promise<InventoryTransaction[]>;
  getMaterialConsumption(siteId: SiteId): Promise<MaterialConsumptionRecord[]>;
  getEquipment(siteId: SiteId): Promise<EquipmentAsset[]>;
  getContractors(siteId: SiteId): Promise<Contractor[]>;
  getExpenses(siteId: SiteId): Promise<SiteExpense[]>;
  getSafetyIncidents(siteId: SiteId): Promise<SafetyIncident[]>;
  getSafetyInspections(siteId: SiteId): Promise<SafetyInspection[]>;
  getDocuments(siteId: SiteId): Promise<SiteDocument[]>;
}
