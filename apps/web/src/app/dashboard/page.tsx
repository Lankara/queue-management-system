'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, Bell, CalendarClock, CheckCircle2, ListOrdered, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { SimpleBarChart } from '@/features/analytics/simple-bar-chart';
import { listBranches } from '@/features/branches/branches.api';
import { getAppointmentSummary, getDashboardSummary, getNotificationSummary, getQueueSummary, getTodayActivity } from '@/features/analytics/analytics.api';
import { useBusinessStore } from '@/store/business-store';

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof Activity; tone: 'teal' | 'amber' | 'sky' | 'emerald' | 'rose' | 'violet' }) {
  const toneClass = {
    teal: 'border-teal-200 bg-teal-50 text-teal-900 [&_svg]:text-teal-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 [&_svg]:text-amber-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-900 [&_svg]:text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 [&_svg]:text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-900 [&_svg]:text-rose-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-900 [&_svg]:text-violet-700'
  }[tone];

  return (
    <Card className={`min-h-24 border ${toneClass} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium leading-tight opacity-80">{label}</p>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
    </Card>
  );
}

const dashboardTabs = [
  { id: 'queues', label: 'Queue Status Today' },
  { id: 'appointments', label: 'Appointment Status Today' },
  { id: 'notifications', label: 'Notification Status' },
  { id: 'activity', label: 'Today Activity' }
] as const;

type DashboardTab = (typeof dashboardTabs)[number]['id'];

export default function DashboardPage() {
  const router = useRouter();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('queues');
  const [branchId, setBranchId] = useState('');
  const branchFilter = branchId || undefined;
  const summaryQuery = useQuery({ queryKey: ['dashboard-summary', businessId, branchFilter], queryFn: () => getDashboardSummary(businessId as string, branchFilter), enabled: Boolean(businessId), refetchInterval: 30000 });
  const queueQuery = useQuery({ queryKey: ['queue-summary', businessId, branchFilter], queryFn: () => getQueueSummary(businessId as string, branchFilter), enabled: Boolean(businessId), refetchInterval: 30000 });
  const appointmentQuery = useQuery({ queryKey: ['appointment-summary', businessId, branchFilter], queryFn: () => getAppointmentSummary(businessId as string, branchFilter), enabled: Boolean(businessId), refetchInterval: 30000 });
  const notificationQuery = useQuery({ queryKey: ['notification-summary', businessId, branchFilter], queryFn: () => getNotificationSummary(businessId as string, branchFilter), enabled: Boolean(businessId), refetchInterval: 30000 });
  const activityQuery = useQuery({ queryKey: ['today-activity', businessId, branchFilter], queryFn: () => getTodayActivity(businessId as string, branchFilter), enabled: Boolean(businessId), refetchInterval: 30000 });
  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const summary = summaryQuery.data;
  const activityEvents = Array.isArray(activityQuery.data) ? activityQuery.data : [];
  const branches = branchesQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <PageHeader title="Dashboard" description="Operational visibility for queues, appointments, notifications, and today activity." />
      {!businessId ? <><BusinessSelector /><Card className="text-sm text-slate-600">Select a business to view analytics.</Card></> : null}
      {businessId ? <>
        <div className="flex flex-col gap-2 sm:max-w-sm">
          <label className="text-sm font-medium text-slate-800" htmlFor="dashboard-branch-filter">Branch</label>
          <select id="dashboard-branch-filter" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            <option value="">All branches</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <KpiCard label="Queues Today" value={summary?.totalQueuesToday ?? '...'} icon={ListOrdered} tone="teal" />
          <KpiCard label="Waiting Now" value={summary?.waitingQueues ?? '...'} icon={Activity} tone="amber" />
          <KpiCard label="In Service" value={summary?.inServiceQueues ?? '...'} icon={Stethoscope} tone="sky" />
          <KpiCard label="Completed Today" value={summary?.completedQueuesToday ?? '...'} icon={CheckCircle2} tone="emerald" />
          <KpiCard label="Appointments Today" value={summary?.totalAppointmentsToday ?? '...'} icon={CalendarClock} tone="violet" />
          <KpiCard label="Notifications Pending" value={summary?.pendingNotifications ?? '...'} icon={Bell} tone="rose" />
        </div>
        <Card className="grid gap-4">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
            {dashboardTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`h-10 shrink-0 rounded-md px-4 text-sm font-medium transition ${activeTab === tab.id ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="max-h-[520px] overflow-y-auto pr-1">
            {activeTab === 'queues' ? <SimpleBarChart title="Queue Status Today" data={queueQuery.data?.counts ?? {}} /> : null}
            {activeTab === 'appointments' ? (
              <button
                type="button"
                onClick={() => router.push('/dashboard/appointments')}
                className="block w-full rounded-md p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                aria-label="Open appointment management"
              >
                <SimpleBarChart title="Appointment Status Today" data={appointmentQuery.data ?? {}} />
                <span className="mt-2 inline-flex text-xs font-semibold text-teal-700">Open appointment management</span>
              </button>
            ) : null}
            {activeTab === 'notifications' ? <SimpleBarChart title="Notification Status" data={notificationQuery.data?.counts ?? {}} /> : null}
            {activeTab === 'activity' ? (
              <div className="grid gap-3">
                {!activityQuery.isLoading && activityEvents.length === 0 ? <p className="text-sm text-slate-500">No activity found today.</p> : null}
                {activityEvents.map((event) => <div key={`${event.type}-${event.id}`} className="rounded-md border border-slate-200 p-3"><div className="flex justify-between gap-3 text-sm"><span className="font-medium text-slate-950">{event.type}</span><span className="text-slate-500">{new Date(event.createdAt).toLocaleTimeString()}</span></div><p className="text-sm text-slate-600">{event.title} {event.subtitle ? `- ${event.subtitle}` : ''}</p></div>)}
              </div>
            ) : null}
          </div>
        </Card>
      </> : null}
    </div>
  );
}
