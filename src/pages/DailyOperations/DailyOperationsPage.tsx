import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  LayoutGrid,
  List,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContext } from '../../hooks/useSiteContext';
import { useBuildFlowStore } from '../../store/useBuildFlowStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { PriorityLevel, TaskStatus } from '../../types/domain';
import { cn } from '../../utils/format';

const TASK_STATUSES: TaskStatus[] = [
  'Not Started',
  'Assigned',
  'In Progress',
  'Blocked',
  'Completed',
  'Verified',
];

const taskSchema = z.object({
  title: z.string().min(4, 'Task title is required'),
  workArea: z.string().min(2, 'Select a work area'),
  assignedToId: z.string().min(1, 'Assign a supervisor or engineer'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  startDate: z.string().min(1),
  dueDate: z.string().min(1),
  description: z.string().min(6, 'Provide clear task instructions'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const diarySchema = z.object({
  date: z.string().min(1),
  weatherNote: z.string().min(3, 'Enter manually observed weather'),
  workCompleted: z.string().min(5, 'Describe completed work'),
  workInProgress: z.string().min(5, 'Describe work in progress'),
  materialsReceivedSummary: z.string().min(2),
  equipmentUsedSummary: z.string().min(2),
  delays: z.string(),
  incidentsSummary: z.string(),
  remarks: z.string(),
  submitNow: z.boolean().optional(),
});

type DiaryFormValues = z.infer<typeof diarySchema>;

export const DailyOperationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get('action');

  const { activeSite, siteTasks, siteDailyReports, siteEmployees, managerProfile } = useSiteContext();
  const createTask = useBuildFlowStore((s) => s.createTask);
  const updateTaskStatus = useBuildFlowStore((s) => s.updateTaskStatus);
  const createDailyReport = useBuildFlowStore((s) => s.createDailyReport);
  const submitDailyReport = useBuildFlowStore((s) => s.submitDailyReport);
  const amendDailyReport = useBuildFlowStore((s) => s.amendDailyReport);

  const [tab, setTab] = useState<'tasks' | 'diary'>(initialAction === 'new-report' ? 'diary' : 'tasks');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [diaryModalOpen, setDiaryModalOpen] = useState(initialAction === 'new-report');
  const [amendTargetId, setAmendTargetId] = useState<string | null>(null);
  const [amendReason, setAmendReason] = useState('');
  const [amendSummary, setAmendSummary] = useState('');

  const teamMembers = useMemo(
    () => siteEmployees.filter((e) => ['Site Engineer', 'Supervisor', 'Foreman'].includes(e.designation)),
    [siteEmployees]
  );

  const filteredTasks = useMemo(() => {
    return siteTasks.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (
        searchQuery.trim() &&
        !`${t.title} ${t.workArea} ${t.assignedToName}`.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [siteTasks, statusFilter, priorityFilter, searchQuery]);

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      workArea: activeSite.geofence.zones[0]?.name ?? 'Tower A',
      assignedToId: teamMembers[0]?.id ?? '',
      priority: 'High',
      startDate: '2026-11-18',
      dueDate: '2026-11-19',
      description: '',
    },
  });

  const diaryForm = useForm<DiaryFormValues>({
    resolver: zodResolver(diarySchema),
    defaultValues: {
      date: '2026-11-18',
      weatherNote: 'Clear sky, 30°C (manual observation)',
      workCompleted: '',
      workInProgress: '',
      materialsReceivedSummary: 'Pending site stores tally',
      equipmentUsedSummary: 'Standard shift plant utilization',
      delays: 'None',
      incidentsSummary: 'None',
      remarks: '',
      submitNow: false,
    },
  });

  const onCreateTask = (values: TaskFormValues) => {
    const assignee = teamMembers.find((m) => m.id === values.assignedToId);
    createTask({
      siteId: activeSite.id,
      title: values.title,
      description: values.description,
      workArea: values.workArea,
      assignedToId: values.assignedToId,
      assignedToName: assignee?.name ?? 'Assigned Supervisor',
      assignedRole: assignee?.designation ?? 'Supervisor',
      priority: values.priority as PriorityLevel,
      status: 'Assigned',
      startDate: values.startDate,
      dueDate: values.dueDate,
      progressPct: 10,
    });
    toast.success('Site task created and assigned');
    taskForm.reset();
    setTaskModalOpen(false);
  };

  const onCreateDiary = (values: DiaryFormValues) => {
    createDailyReport({
      siteId: activeSite.id,
      date: values.date,
      weatherNote: values.weatherNote,
      totalWorkforce: activeSite.workforceStats.assigned,
      workersPresent: activeSite.workforceStats.present,
      workCompleted: values.workCompleted,
      workInProgress: values.workInProgress,
      materialsReceivedSummary: values.materialsReceivedSummary,
      equipmentUsedSummary: values.equipmentUsedSummary,
      delays: values.delays || 'None',
      incidentsSummary: values.incidentsSummary || 'None',
      remarks: values.remarks || '—',
      submittedBy: `${managerProfile.name} (${managerProfile.designation})`,
      status: values.submitNow ? 'Submitted' : 'Draft',
    });
    toast.success(values.submitNow ? 'Daily Site Diary submitted' : 'Daily Site Diary saved as Draft');
    diaryForm.reset();
    setDiaryModalOpen(false);
  };

  const handleSaveAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendTargetId || !amendReason.trim() || !amendSummary.trim()) {
      toast.error('Reason and amendment summary are required.');
      return;
    }
    amendDailyReport(amendTargetId, amendReason.trim(), amendSummary.trim());
    toast.success('Amendment appended to submitted diary (original preserved)');
    setAmendTargetId(null);
    setAmendReason('');
    setAmendSummary('');
  };

  return (
    <div>
      <PageHeader
        title="Daily Operations"
        description={`Coordinate today's site tasks, supervisor allocations, and official daily site diary for ${activeSite.name}.`}
        breadcrumbs={[{ label: 'Site Workspace', to: '/' }, { label: 'Daily Operations' }]}
        secondaryActions={
          <button
            type="button"
            onClick={() => setDiaryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F7FA]"
          >
            <ClipboardCheck className="w-4 h-4 text-[#2563EB]" />
            New Daily Diary
          </button>
        }
        primaryAction={
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Site Task
          </button>
        }
      />

      {/* Today's Operational Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
          <div className="text-xs text-[#64748B]">Workforce On Site</div>
          <div className="text-xl font-bold text-[#172B4D] font-display tabular-nums mt-1">
            {activeSite.workforceStats.currentlyOnSite}{' '}
            <span className="text-xs font-normal text-[#64748B]">/ {activeSite.workforceStats.assigned}</span>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
          <div className="text-xs text-[#64748B]">Active Site Tasks</div>
          <div className="text-xl font-bold text-[#172B4D] font-display tabular-nums mt-1">
            {siteTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Verified').length}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
          <div className="text-xs text-[#64748B]">Blocked Tasks</div>
          <div className="text-xl font-bold text-[#DC2626] font-display tabular-nums mt-1">
            {siteTasks.filter((t) => t.status === 'Blocked').length}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5">
          <div className="text-xs text-[#64748B]">Daily Diary Records</div>
          <div className="text-xl font-bold text-[#172B4D] font-display tabular-nums mt-1">
            {siteDailyReports.length}
          </div>
        </div>
      </div>

      {/* Sub-module Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('tasks')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors',
              tab === 'tasks' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B] hover:text-[#172B4D]'
            )}
          >
            Task Board ({siteTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('diary')}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors',
              tab === 'diary' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#64748B] hover:text-[#172B4D]'
            )}
          >
            Daily Site Diary ({siteDailyReports.length})
          </button>
        </div>

        {tab === 'tasks' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
            >
              <option value="ALL">All Statuses</option>
              {TASK_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <div className="inline-flex bg-white border border-[#E2E8F0] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={cn('p-1.5 rounded-md', viewMode === 'kanban' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#64748B]')}
                aria-label="Kanban view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md', viewMode === 'list' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#64748B]')}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        filteredTasks.length === 0 ? (
          <EmptyState
            title="No matching site tasks"
            description="Adjust your filters or create a new daily task for a supervisor or site engineer."
            action={
              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white"
              >
                Create Site Task
              </button>
            }
          />
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(['Assigned', 'In Progress', 'Blocked', 'Completed', 'Verified', 'Not Started'] as TaskStatus[])
              .filter((col) => statusFilter === 'ALL' || statusFilter === col)
              .map((colStatus) => {
                const colTasks = filteredTasks.filter((t) => t.status === colStatus);
                return (
                  <div key={colStatus} className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <StatusBadge label={colStatus} />
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#64748B] tabular-nums">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {colTasks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#64748B]">No tasks in {colStatus}</div>
                      ) : (
                        colTasks.map((task) => (
                          <div key={task.id} className="p-3.5 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] space-y-2">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
                              <span className="truncate">{task.workArea}</span>
                              <StatusBadge label={task.priority} />
                            </div>
                            <h3 className="text-xs font-bold text-[#172B4D] leading-snug">{task.title}</h3>
                            <p className="text-xs text-[#64748B] line-clamp-2">{task.description}</p>
                            <div className="pt-1 flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
                              <span>{task.assignedToName}</span>
                              <span className="font-mono tabular-nums">Due {task.dueDate}</span>
                            </div>
                            <div className="pt-1">
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  const next = e.target.value as TaskStatus;
                                  updateTaskStatus(task.id, next);
                                  toast.success(`Task moved to ${next}`);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-md font-medium text-[#172B4D]"
                              >
                                {TASK_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    Status: {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold text-[#64748B] uppercase">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-3">Work Area</th>
                    <th className="py-3 px-3">Assignee</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Due</th>
                    <th className="py-3 px-4">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#F5F7FA]/60">
                      <td className="py-3 px-4 font-semibold text-[#172B4D] max-w-xs">{task.title}</td>
                      <td className="py-3 px-3 text-[#64748B]">{task.workArea}</td>
                      <td className="py-3 px-3 text-[#172B4D]">{task.assignedToName}</td>
                      <td className="py-3 px-3"><StatusBadge label={task.priority} /></td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#64748B]">{task.dueDate}</td>
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => {
                            updateTaskStatus(task.id, e.target.value as TaskStatus);
                            toast.success('Task status updated');
                          }}
                          className="px-2 py-1 text-xs bg-white border border-[#E2E8F0] rounded-md"
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* DAILY DIARY TAB */}
      {tab === 'diary' && (
        <div className="space-y-4">
          {siteDailyReports.map((rep) => (
            <div key={rep.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-sm font-bold text-[#172B4D] tabular-nums">{rep.date}</span>
                    <StatusBadge label={rep.status} />
                    <span className="text-xs text-[#64748B]">
                      By {rep.submittedBy} {rep.submittedAt ? `· Submitted ${rep.submittedAt}` : ''}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    Weather Log: {rep.weatherNote} · Workforce Present: <strong className="text-[#172B4D] font-mono">{rep.workersPresent}</strong> / {rep.totalWorkforce}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rep.status === 'Draft' ? (
                    <button
                      type="button"
                      onClick={() => {
                        submitDailyReport(rep.id);
                        toast.success(`Daily report for ${rep.date} submitted and locked for audit`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16A34A] text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submit Diary
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAmendTargetId(rep.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F5F7FA] border border-[#E2E8F0] text-[#172B4D] hover:bg-slate-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Log Amendment
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold text-[#172B4D] mb-1">Work Completed</div>
                  <p className="text-[#64748B] leading-relaxed">{rep.workCompleted}</p>
                </div>
                <div>
                  <div className="font-semibold text-[#172B4D] mb-1">Work in Progress</div>
                  <p className="text-[#64748B] leading-relaxed">{rep.workInProgress}</p>
                </div>
                <div>
                  <div className="font-semibold text-[#172B4D] mb-1">Materials Received</div>
                  <p className="text-[#64748B] leading-relaxed">{rep.materialsReceivedSummary}</p>
                </div>
                <div>
                  <div className="font-semibold text-[#172B4D] mb-1">Equipment Utilized</div>
                  <p className="text-[#64748B] leading-relaxed">{rep.equipmentUsedSummary}</p>
                </div>
                <div>
                  <div className="font-semibold text-[#172B4D] mb-1">Delays & Constraints</div>
                  <p className="text-[#64748B] leading-relaxed">{rep.delays}</p>
                </div>
                <div>
                  <div className="font-semibold text-[#172B4D] mb-1">Safety & Remarks</div>
                  <p className="text-[#64748B] leading-relaxed">{rep.incidentsSummary} — {rep.remarks}</p>
                </div>
              </div>

              {rep.amendments.length > 0 && (
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="text-xs font-semibold text-[#172B4D]">
                    Submitted Amendments ({rep.amendments.length}) — Original Record Preserved
                  </div>
                  {rep.amendments.map((amd) => (
                    <div key={amd.id} className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                      <div className="font-medium text-amber-950">
                        {amd.amendedBy} · <span className="font-mono">{amd.amendedAt}</span>
                      </div>
                      <div className="text-amber-900 mt-0.5">
                        <strong>Reason:</strong> {amd.reason} — {amd.summary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Create & Assign Site Task"
        subtitle={`Task will be scoped to ${activeSite.name}`}
      >
        <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Task Title</label>
            <input
              {...taskForm.register('title')}
              placeholder="e.g., Tower A Floor-10 Column Starter Shuttering"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
            {taskForm.formState.errors.title && (
              <p className="text-[#DC2626] mt-1">{taskForm.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Work Area</label>
              <select
                {...taskForm.register('workArea')}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {activeSite.geofence.zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Assign To</label>
              <select
                {...taskForm.register('assignedToId')}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Priority</label>
              <select {...taskForm.register('priority')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Start Date</label>
              <input type="date" {...taskForm.register('startDate')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Due Date</label>
              <input type="date" {...taskForm.register('dueDate')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Instructions & QA Notes</label>
            <textarea
              {...taskForm.register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
            {taskForm.formState.errors.description && (
              <p className="text-[#DC2626] mt-1">{taskForm.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTaskModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#172B4D] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700"
            >
              Assign Task
            </button>
          </div>
        </form>
      </Modal>

      {/* New Daily Diary Modal */}
      <Modal
        open={diaryModalOpen}
        onClose={() => setDiaryModalOpen(false)}
        title="New Daily Site Diary Entry"
        subtitle={`${activeSite.name} · Submitted diaries preserve full immutable audit history`}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={diaryForm.handleSubmit(onCreateDiary)} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Diary Date</label>
              <input type="date" {...diaryForm.register('date')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Observed Weather (Manual)</label>
              <input {...diaryForm.register('weatherNote')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Work Completed Today</label>
            <textarea {...diaryForm.register('workCompleted')} rows={2} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            {diaryForm.formState.errors.workCompleted && (
              <p className="text-[#DC2626] mt-1">{diaryForm.formState.errors.workCompleted.message}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Work In Progress</label>
            <textarea {...diaryForm.register('workInProgress')} rows={2} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Materials Received</label>
              <input {...diaryForm.register('materialsReceivedSummary')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Equipment Used</label>
              <input {...diaryForm.register('equipmentUsedSummary')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Delays / Bottlenecks</label>
              <input {...diaryForm.register('delays')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Safety Incidents</label>
              <input {...diaryForm.register('incidentsSummary')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg" />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 text-[#172B4D] font-medium">
            <input type="checkbox" {...diaryForm.register('submitNow')} className="rounded border-slate-300" />
            <span>Submit immediately (locks entry; future changes require Amendment)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDiaryModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Save Daily Diary
            </button>
          </div>
        </form>
      </Modal>

      {/* Amendment Modal */}
      <Modal
        open={Boolean(amendTargetId)}
        onClose={() => setAmendTargetId(null)}
        title="Log Daily Diary Amendment"
        subtitle="Original submitted record remains intact; amendment is appended with timestamp."
      >
        <form onSubmit={handleSaveAmendment} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Reason for Correction</label>
            <input
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              placeholder="e.g., Late RMC transit mixer count verified at gate"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#172B4D] mb-1">Amended Detail</label>
            <textarea
              value={amendSummary}
              onChange={(e) => setAmendSummary(e.target.value)}
              rows={3}
              placeholder="Specify updated quantity, hours, or observation..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAmendTargetId(null)} className="px-4 py-2 rounded-lg border border-[#E2E8F0]">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold">
              Append Amendment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
