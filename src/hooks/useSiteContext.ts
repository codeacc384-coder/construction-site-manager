import { useMemo } from 'react';
import { useBuildFlowStore } from '../store/useBuildFlowStore';
import { PermissionKey, hasPermission } from '../utils/permissions';

export function useSiteContext() {
  const store = useBuildFlowStore();
  const activeSite = useMemo(
    () => store.sites.find((s) => s.id === store.activeSiteId) ?? store.sites[0],
    [store.sites, store.activeSiteId]
  );

  const siteId = activeSite.id;

  const siteEmployees = useMemo(() => store.employees.filter((e) => e.siteId === siteId), [store.employees, siteId]);
  const siteAttendance = useMemo(
    () => store.attendanceSessions.filter((a) => a.siteId === siteId),
    [store.attendanceSessions, siteId]
  );
  const siteExceptions = useMemo(
    () => store.attendanceExceptions.filter((e) => e.siteId === siteId),
    [store.attendanceExceptions, siteId]
  );
  const siteTasks = useMemo(() => store.tasks.filter((t) => t.siteId === siteId), [store.tasks, siteId]);
  const siteDailyReports = useMemo(
    () => store.dailyReports.filter((r) => r.siteId === siteId),
    [store.dailyReports, siteId]
  );
  const siteActivities = useMemo(
    () => store.workActivities.filter((w) => w.siteId === siteId),
    [store.workActivities, siteId]
  );
  const siteShifts = useMemo(() => store.shifts.filter((s) => s.siteId === siteId), [store.shifts, siteId]);
  const siteLeaveRequests = useMemo(
    () => store.leaveRequests.filter((l) => l.siteId === siteId),
    [store.leaveRequests, siteId]
  );
  const siteOvertimeRequests = useMemo(
    () => store.overtimeRequests.filter((o) => o.siteId === siteId),
    [store.overtimeRequests, siteId]
  );
  const sitePurchaseRequests = useMemo(
    () => store.purchaseRequests.filter((p) => p.siteId === siteId),
    [store.purchaseRequests, siteId]
  );
  const siteReceipts = useMemo(
    () => store.materialReceipts.filter((r) => r.siteId === siteId),
    [store.materialReceipts, siteId]
  );
  const siteInventory = useMemo(() => store.inventory.filter((i) => i.siteId === siteId), [store.inventory, siteId]);
  const siteTransactions = useMemo(
    () => store.inventoryTransactions.filter((t) => t.siteId === siteId),
    [store.inventoryTransactions, siteId]
  );
  const siteConsumption = useMemo(
    () => store.consumptionRecords.filter((c) => c.siteId === siteId),
    [store.consumptionRecords, siteId]
  );
  const siteEquipment = useMemo(() => store.equipment.filter((e) => e.siteId === siteId), [store.equipment, siteId]);
  const siteContractors = useMemo(
    () => store.contractors.filter((c) => c.siteId === siteId),
    [store.contractors, siteId]
  );
  const siteExpenses = useMemo(() => store.expenses.filter((e) => e.siteId === siteId), [store.expenses, siteId]);
  const siteIncidents = useMemo(
    () => store.safetyIncidents.filter((i) => i.siteId === siteId),
    [store.safetyIncidents, siteId]
  );
  const siteInspections = useMemo(
    () => store.safetyInspections.filter((i) => i.siteId === siteId),
    [store.safetyInspections, siteId]
  );
  const siteDocuments = useMemo(() => store.documents.filter((d) => d.siteId === siteId), [store.documents, siteId]);
  const siteNotifications = useMemo(
    () => store.notifications.filter((n) => n.siteId === siteId),
    [store.notifications, siteId]
  );
  const siteActivityEvents = useMemo(
    () => store.activityEvents.filter((a) => a.siteId === siteId),
    [store.activityEvents, siteId]
  );

  // Derived Pending Counts (strictly site-scoped)
  const pendingApprovalCount = useMemo(() => {
    return (
      siteExceptions.filter((e) => e.status === 'Pending').length +
      siteLeaveRequests.filter((l) => l.status === 'Pending').length +
      siteOvertimeRequests.filter((o) => o.status === 'Pending').length +
      sitePurchaseRequests.filter((p) => p.status === 'Pending Site Manager').length +
      siteReceipts.filter((r) => r.status === 'Received Pending Verification').length +
      siteExpenses.filter((e) => e.status === 'Pending Review').length
    );
  }, [siteExceptions, siteLeaveRequests, siteOvertimeRequests, sitePurchaseRequests, siteReceipts, siteExpenses]);

  const openSafetyCount = useMemo(
    () => siteIncidents.filter((i) => i.status === 'Open' || i.status === 'Corrective Action Assigned').length,
    [siteIncidents]
  );

  const pendingMaterialsCount = useMemo(
    () =>
      sitePurchaseRequests.filter((p) => p.status === 'Pending Site Manager').length +
      siteReceipts.filter((r) => r.status === 'Received Pending Verification').length,
    [sitePurchaseRequests, siteReceipts]
  );

  const unreadNotificationsCount = useMemo(
    () => siteNotifications.filter((n) => !n.read).length,
    [siteNotifications]
  );

  const can = (perm: PermissionKey) => hasPermission(store.managerProfile, perm);

  return {
    activeSite,
    sites: store.sites,
    managerProfile: store.managerProfile,
    can,
    siteEmployees,
    siteAttendance,
    siteExceptions,
    siteTasks,
    siteDailyReports,
    siteActivities,
    siteShifts,
    siteLeaveRequests,
    siteOvertimeRequests,
    sitePurchaseRequests,
    siteReceipts,
    siteInventory,
    siteTransactions,
    siteConsumption,
    siteEquipment,
    siteContractors,
    siteExpenses,
    siteIncidents,
    siteInspections,
    siteDocuments,
    siteNotifications,
    siteActivityEvents,
    pendingApprovalCount,
    openSafetyCount,
    pendingMaterialsCount,
    unreadNotificationsCount,
  };
}
