import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  FileBarChart2,
  Users,
  MapPinCheck,
  HardHat,
  Clock3,
  CalendarClock,
  ShoppingCart,
  PackageCheck,
  Boxes,
  Flame,
  Wrench,
  Briefcase,
  ReceiptIndianRupee,
  ShieldAlert,
  FolderOpen,
  CheckSquare,
  Bell,
  Settings,
  LifeBuoy,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badgeKey?: 'approvals' | 'notifications' | 'safety';
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const SITE_MANAGER_NAV: NavGroup[] = [
  {
    group: 'Site Workspace',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard },
      { label: 'Daily Operations', path: '/daily-operations', icon: ClipboardList },
      { label: 'Site Progress', path: '/site-progress', icon: TrendingUp },
      { label: 'Site Reports', path: '/site-reports', icon: FileBarChart2 },
    ],
  },
  {
    group: 'Workforce',
    items: [
      { label: 'Workforce', path: '/workforce', icon: Users },
      { label: 'Attendance & Tracking', path: '/attendance', icon: MapPinCheck },
      { label: 'Supervisors & Engineers', path: '/team', icon: HardHat },
      { label: 'Shift Management', path: '/shifts', icon: Clock3 },
      { label: 'Leave & Overtime', path: '/requests', icon: CalendarClock },
    ],
  },
  {
    group: 'Materials & Assets',
    items: [
      { label: 'Procurement Requests', path: '/procurement', icon: ShoppingCart },
      { label: 'Material Receipts', path: '/receipts', icon: PackageCheck },
      { label: 'Site Inventory', path: '/inventory', icon: Boxes },
      { label: 'Material Consumption', path: '/consumption', icon: Flame },
      { label: 'Equipment & Machinery', path: '/equipment', icon: Wrench },
      { label: 'Contractors', path: '/contractors', icon: Briefcase },
    ],
  },
  {
    group: 'Site Management',
    items: [
      { label: 'Site Expenses', path: '/expenses', icon: ReceiptIndianRupee },
      { label: 'Safety & Incidents', path: '/safety', icon: ShieldAlert, badgeKey: 'safety' },
      { label: 'Documents', path: '/documents', icon: FolderOpen },
      { label: 'Approvals', path: '/approvals', icon: CheckSquare, badgeKey: 'approvals' },
      { label: 'Notifications', path: '/notifications', icon: Bell, badgeKey: 'notifications' },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Site Settings', path: '/settings', icon: Settings },
      { label: 'Help & Support', path: '/support', icon: LifeBuoy },
      { label: 'My Profile', path: '/profile', icon: UserCircle2 },
    ],
  },
];
