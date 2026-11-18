import { SiteManagerProfile } from '../types/domain';

export type PermissionKey = keyof SiteManagerProfile['permissions'];

export function hasPermission(profile: SiteManagerProfile, key: PermissionKey): boolean {
  return Boolean(profile.permissions[key]);
}

export function isWithinPurchaseLimit(profile: SiteManagerProfile, amountInr: number): boolean {
  return (
    profile.permissions.canApprovePurchasesWithinLimit &&
    amountInr <= profile.delegatedLimits.purchaseApprovalLimitInr
  );
}

export function isWithinExpenseLimit(profile: SiteManagerProfile, amountInr: number): boolean {
  return (
    profile.permissions.canApproveExpensesWithinLimit &&
    amountInr <= profile.delegatedLimits.expenseApprovalLimitInr
  );
}

export const RESTRICTED_ADMIN_ACTIONS = [
  'View unrelated company construction sites',
  'Access company-wide employee payroll & bank details',
  'Modify organization subscription or billing plan',
  'Alter company-wide RBAC roles or approval matrix',
  'Transfer or adjust inventory on unassigned sites',
  'Approve capital expenses beyond delegated site limits',
  'Delete historical safety incident or attendance audit logs',
];
