export type OrganizationId = string;
export type SiteId = string;

export type SiteOperatingStatus = 'Active' | 'Weather Hold' | 'Inspection Hold' | 'Completed';

export interface GeofenceConfig {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  polygonLabel: string;
  zones: Array<{
    id: string;
    name: string;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    color: string;
  }>;
}

export interface Site {
  id: SiteId;
  organizationId: OrganizationId;
  code: string;
  name: string;
  location: string;
  address: string;
  siteManagerId: string;
  siteManagerName: string;
  assignedEngineerIds: string[];
  supervisorIds: string[];
  operatingStatus: SiteOperatingStatus;
  startDate: string;
  expectedCompletionDate: string;
  overallProgress: number;
  plannedProgress: number;
  geofence: GeofenceConfig;
  workingDays: string[];
  defaultShiftStart: string;
  defaultShiftEnd: string;
  emergencyContact: string;
  // Consistent daily headcount snapshot baseline
  workforceStats: {
    assigned: number;
    present: number;
    onTime: number;
    late: number;
    absent: number;
    onLeave: number;
    notSubmitted: number;
    checkedOut: number;
    currentlyOnSite: number;
    activeTracking: number;
    staleTracking: number;
  };
}

export type WorkforceCategory =
  | 'Site Engineer'
  | 'Supervisor'
  | 'Foreman'
  | 'Skilled Labour'
  | 'Unskilled Labour'
  | 'Electrician'
  | 'Plumber'
  | 'Mason'
  | 'Carpenter'
  | 'Welder'
  | 'Painter'
  | 'Steel Fixer'
  | 'Machine Operator'
  | 'Driver'
  | 'Contractor Worker';

export type EmploymentType = 'Direct Permanent' | 'Contract Payroll' | 'Daily Wage' | 'Subcontractor';
export type AssignmentStatus = 'Active' | 'Pending Transfer' | 'Released' | 'Temporary';
export type AttendanceDayStatus = 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Missing Checkout' | 'Not Submitted';
export type TrackingStatus = 'Active' | 'Stale Location' | 'Checked Out' | 'Tracking Unavailable';

export interface SiteAssignmentRecord {
  id: string;
  employeeId: string;
  siteId: SiteId;
  siteName: string;
  workArea: string;
  roleOnSite: string;
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  approvedBy: string;
}

export interface Employee {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  empCode: string;
  name: string;
  designation: WorkforceCategory;
  department: 'Civil & Structural' | 'MEP' | 'Finishing' | 'Site Supervision' | 'Plant & Machinery' | 'Safety & QA';
  employmentType: EmploymentType;
  contractorId?: string;
  contractorName?: string;
  supervisorId: string;
  supervisorName: string;
  workArea: string;
  shiftName: string;
  attendanceStatus: AttendanceDayStatus;
  assignmentStatus: AssignmentStatus;
  phone?: string; // Redacted if permission lacking
  email?: string;
  joinedDate: string;
  bloodGroup?: string;
  safetyInductionDate: string;
  avatarColor: string;
  assignmentHistory: SiteAssignmentRecord[];
  documents: Array<{ id: string; title: string; type: string; verified: boolean; expiry?: string }>;
}

export interface AttendanceSession {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: WorkforceCategory;
  supervisorName: string;
  workArea: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: number;
  method: 'Mobile App + Geofence' | 'Supervisor Roster' | 'Offline Sync';
  gpsVerification: 'Verified Inside Geofence' | 'Outside Perimeter' | 'Unavailable' | 'Pending Sync';
  selfieVerification: 'Verified' | 'Pending' | 'Flagged' | 'Not Captured';
  approvalStatus: 'Auto-Verified' | 'Approved' | 'Pending Review' | 'Correction Requested' | 'Rejected';
  trackingStatus: TrackingStatus;
  lastLocationUpdate: string;
  zoneId: string;
  zoneName: string;
  simX: number; // Simulated coordinate % inside site schematic
  simY: number;
  accuracyMeters?: number;
  offlineCapturedAt?: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface AttendanceException {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: WorkforceCategory;
  date: string;
  exceptionType: 'Missing Check-in' | 'Missing Check-out' | 'Incorrect Attendance' | 'GPS Issue' | 'Duplicate Attendance';
  requestedTime: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Clarification Requested';
  auditHistory: Array<{
    timestamp: string;
    actor: string;
    action: string;
    remark: string;
  }>;
}

export type TaskStatus = 'Not Started' | 'Assigned' | 'In Progress' | 'Blocked' | 'Completed' | 'Verified';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SiteTask {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  title: string;
  description: string;
  workArea: string;
  assignedToId: string;
  assignedToName: string;
  assignedRole: string;
  priority: PriorityLevel;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  progressPct: number;
  completionRemarks?: string;
  hasReferencePhoto?: boolean;
}

export interface DailySiteReport {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  date: string;
  weatherNote: string;
  totalWorkforce: number;
  workersPresent: number;
  workCompleted: string;
  workInProgress: string;
  materialsReceivedSummary: string;
  equipmentUsedSummary: string;
  delays: string;
  incidentsSummary: string;
  remarks: string;
  submittedBy: string;
  submittedAt?: string;
  status: 'Draft' | 'Submitted' | 'Reviewed';
  amendments: Array<{
    id: string;
    amendedAt: string;
    amendedBy: string;
    reason: string;
    summary: string;
  }>;
}

export type WorkCategory =
  | 'Excavation'
  | 'Foundation'
  | 'RCC'
  | 'Structural Work'
  | 'Masonry'
  | 'Plastering'
  | 'Electrical'
  | 'Plumbing'
  | 'Flooring'
  | 'Painting'
  | 'Finishing';

export interface WorkActivity {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  category: WorkCategory;
  name: string;
  workArea: string;
  assignedEngineer: string;
  supervisorName: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  quantityPlanned: number;
  quantityCompleted: number;
  unit: string;
  plannedProgressPct: number;
  progressPct: number;
  status: 'Not Started' | 'On Track' | 'Delayed' | 'Completed';
  remarks: string;
  updateHistory: Array<{
    id: string;
    date: string;
    addedQuantity: number;
    newTotalQuantity: number;
    updatedBy: string;
    remarks: string;
    evidenceLabel?: string;
  }>;
}

export interface ShiftDefinition {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  name: string;
  type: 'General Shift' | 'Day Shift' | 'Night Shift' | 'Custom Shift' | 'Rotational Shift';
  startTime: string;
  endTime: string;
  breakMinutes: number;
  assignedCount: number;
  supervisorName: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface LeaveRequest {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  employeeId: string;
  employeeName: string;
  designation: WorkforceCategory;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Emergency Leave';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  attendanceImpact: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Clarification Requested';
  decisionRemark?: string;
}

export interface OvertimeRequest {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  employeeId: string;
  employeeName: string;
  designation: WorkforceCategory;
  date: string;
  scheduledShift: string;
  requestedHours: number;
  reason: string;
  supervisorRecommendation: string;
  requiresHigherApproval: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Escalated to Admin';
  auditTrail: Array<{ timestamp: string; actor: string; action: string; remark: string }>;
}

export interface PurchaseItem {
  id: string;
  category: string;
  materialName: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
}

export interface PurchaseRequest {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  requestCode: string;
  title: string;
  workArea: string;
  requesterName: string;
  requesterRole: string;
  requestDate: string;
  requiredByDate: string;
  preferredSupplier: string;
  priority: PriorityLevel;
  reason: string;
  items: PurchaseItem[];
  estimatedTotal: number;
  currentStep: 'Supervisor' | 'Site Engineer' | 'Site Manager' | 'Procurement' | 'Finance';
  status: 'Pending Site Manager' | 'Approved by Site Manager' | 'Forwarded to Procurement' | 'Clarification Requested' | 'Rejected';
  stockChecked: boolean;
  remarks?: string;
}

export interface MaterialReceipt {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  poNumber: string;
  supplier: string;
  materialName: string;
  category: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  acceptedQuantity: number;
  unit: string;
  deliveryDateTime: string;
  vehicleNumber: string;
  challanNumber: string;
  invoiceReference: string;
  hasDeliveryPhotos: boolean;
  status: 'Expected' | 'Partially Received' | 'Received Pending Verification' | 'Verified' | 'Rejected' | 'Disputed';
  verifiedBy?: string;
  remarks: string;
}

export interface InventoryItem {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  materialCode: string;
  name: string;
  category: 'Cement & Aggregates' | 'Reinforcement Steel' | 'Masonry & Blocks' | 'Electrical & Conduit' | 'Plumbing & Pipes' | 'Safety & Consumables';
  availableQuantity: number;
  reservedQuantity: number;
  minimumStockLevel: number;
  unit: string;
  unitValueInr: number;
  lastReceiptDate: string;
  status: 'Normal' | 'Low Stock' | 'Out of Stock';
}

export interface InventoryTransaction {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  materialId: string;
  materialName: string;
  type: 'Material Receipt' | 'Material Issue' | 'Material Consumption' | 'Material Transfer' | 'Damaged Material' | 'Stock Adjustment';
  quantity: number;
  unit: string;
  source: string;
  destination: string;
  timestamp: string;
  submittedBy: string;
  approvedBy: string;
  remarks: string;
}

export interface MaterialConsumptionRecord {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  activityId: string;
  activityName: string;
  workArea: string;
  materialId: string;
  materialName: string;
  plannedQty: number;
  quantityUsed: number;
  unit: string;
  date: string;
  submittedBy: string;
  varianceFlag: boolean;
  remarks: string;
}

export type EquipmentStatus = 'Available' | 'In Use' | 'Under Maintenance' | 'Out of Service' | 'Transferred';

export interface EquipmentAsset {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  assetCode: string;
  name: string;
  category: 'Excavators' | 'Cranes' | 'Concrete Mixers' | 'Generators' | 'Loaders' | 'Tractors' | 'Water Tankers' | 'Vehicles' | 'Tools' | 'Safety Equipment';
  assignedOperator: string;
  workArea: string;
  status: EquipmentStatus;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  hoursLoggedMonth: number;
  fuelType: 'Diesel' | 'Electric' | 'Manual';
  assignmentHistory: Array<{ siteName: string; from: string; to?: string; operator: string }>;
  maintenanceLogs: Array<{ date: string; type: string; description: string; status: string }>;
}

export interface Contractor {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  companyName: string;
  contactPerson: string;
  phone: string;
  workCategory: string;
  contractStart: string;
  contractEnd: string;
  workforceCount: number;
  presentToday: number;
  assignedSupervisor: string;
  workStatus: 'Active' | 'Milestone Review' | 'Hold';
  complianceStatus: 'Compliant' | 'Pending PF/ESIC Renewal' | 'Safety Warning';
  completionPct: number;
  latestBillStatus: 'Not Submitted' | 'Forwarded to Finance' | 'Under Verification';
}

export interface SiteExpense {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  expenseCode: string;
  title: string;
  category: 'Transport' | 'Fuel' | 'Equipment' | 'Minor Repairs' | 'Safety Supplies' | 'Site Maintenance' | 'Utilities' | 'Labour Operational';
  amountInr: number;
  date: string;
  vendor: string;
  paymentMethod: 'Petty Cash' | 'UPI / Site Imprest' | 'Vendor Credit';
  description: string;
  submittedBy: string;
  hasReceipt: boolean;
  status: 'Pending Review' | 'Approved by Site Manager' | 'Forwarded to Finance' | 'Rejected' | 'Paid';
  remarks?: string;
}

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentCategory =
  | 'Injury'
  | 'Near Miss'
  | 'Unsafe Condition'
  | 'Equipment Incident'
  | 'Fire Hazard'
  | 'Electrical Hazard'
  | 'Structural Concern'
  | 'PPE Violation';

export interface SafetyIncident {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  incidentCode: string;
  dateTime: string;
  workArea: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  peopleInvolved: string;
  injuryDetails: string;
  immediateAction: string;
  reportedBy: string;
  assignedSafetyOfficer: string;
  escalatedToAdmin: boolean;
  status: 'Open' | 'Corrective Action Assigned' | 'Resolved' | 'Closed';
}

export interface SafetyInspection {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  title: string;
  workArea: string;
  scheduledDate: string;
  inspectorName: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Action Required';
  checklist: Array<{ id: string; item: string; passed: boolean | null; note?: string }>;
}

export type DocumentCategory =
  | 'Site Drawings'
  | 'Work Orders'
  | 'Project Documents'
  | 'Safety Documents'
  | 'Inspection Reports'
  | 'Material Invoices'
  | 'Delivery Challans'
  | 'Equipment Documents'
  | 'Contractor Documents'
  | 'Site Photographs'
  | 'Daily Reports';

export interface SiteDocument {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  title: string;
  category: DocumentCategory;
  version: string;
  fileSizeLabel: string;
  fileType: 'PDF' | 'DWG' | 'JPG' | 'XLSX';
  uploadedBy: string;
  uploadedAt: string;
  accessLevel: 'Site Team' | 'Manager & Admin' | 'Safety & QA';
  r2ObjectKey: string;
}

export interface AppNotification {
  id: string;
  organizationId: OrganizationId;
  siteId: SiteId;
  title: string;
  message: string;
  category: 'Attendance' | 'Procurement' | 'Safety' | 'Equipment' | 'Approvals' | 'Reports';
  timestamp: string;
  read: boolean;
  targetRoute: string;
  relatedId?: string;
}

export interface ActivityEvent {
  id: string;
  siteId: SiteId;
  time: string;
  actor: string;
  type: 'Attendance' | 'Material' | 'Report' | 'Procurement' | 'Equipment' | 'Safety';
  detail: string;
}

export interface SiteManagerProfile {
  id: string;
  organizationId: OrganizationId;
  empCode: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  reportingManager: string;
  assignedSiteIds: SiteId[];
  delegatedLimits: {
    purchaseApprovalLimitInr: number;
    expenseApprovalLimitInr: number;
    overtimeMaxHoursPerWeek: number;
  };
  permissions: {
    canViewMultiSiteOverview: boolean;
    canViewStockValuation: boolean;
    canViewEmployeeContacts: boolean;
    canApproveAttendanceCorrections: boolean;
    canApprovePurchasesWithinLimit: boolean;
    canVerifyMaterialReceipts: boolean;
    canApproveExpensesWithinLimit: boolean;
    canEditSiteSettings: boolean;
  };
}
