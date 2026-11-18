import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/Overview/OverviewPage';
import { DailyOperationsPage } from './pages/DailyOperations/DailyOperationsPage';
import { SiteProgressPage } from './pages/SiteProgress/SiteProgressPage';
import { SiteReportsPage } from './pages/SiteReports/SiteReportsPage';
import { WorkforcePage } from './pages/Workforce/WorkforcePage';
import { AttendancePage } from './pages/Attendance/AttendancePage';
import { TeamPage } from './pages/Team/TeamPage';
import { ShiftsPage } from './pages/Shifts/ShiftsPage';
import { RequestsPage } from './pages/Requests/RequestsPage';
import { ProcurementPage } from './pages/Procurement/ProcurementPage';
import { ReceiptsPage } from './pages/Receipts/ReceiptsPage';
import { InventoryPage } from './pages/Inventory/InventoryPage';
import { ConsumptionPage } from './pages/Consumption/ConsumptionPage';
import { EquipmentPage } from './pages/Equipment/EquipmentPage';
import { ContractorsPage } from './pages/Contractors/ContractorsPage';
import { ExpensesPage } from './pages/Expenses/ExpensesPage';
import { SafetyPage } from './pages/Safety/SafetyPage';
import { DocumentsPage } from './pages/Documents/DocumentsPage';
import { ApprovalsPage } from './pages/Approvals/ApprovalsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SupportPage } from './pages/Support/SupportPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/daily-operations" element={<DailyOperationsPage />} />
            <Route path="/site-progress" element={<SiteProgressPage />} />
            <Route path="/site-reports" element={<SiteReportsPage />} />
            <Route path="/workforce" element={<WorkforcePage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/consumption" element={<ConsumptionPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/contractors" element={<ContractorsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
