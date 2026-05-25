'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CalendarClock, ListOrdered, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { SimpleBarChart } from '@/features/analytics/simple-bar-chart';
import { getAppointmentSummary, getDashboardSummary, getNotificationSummary, getQueueSummary, getTodayActivity } from '@/features/analytics/analytics.api';
import { useBusinessStore } from '@/store/business-store';

function KpiCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Activity }) {
  return <Card><div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><Icon className="h-4 w-4 text-teal-700" />{label}</div><p className="text-2xl font-semibold text-slate-950">{value}</p></Card>;
}

export default function DashboardPage() {
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const summaryQuery = useQuery({ queryKey: ['dashboard-summary', businessId], queryFn: () => getDashboardSummary(businessId as string), enabled: Boolean(businessId), refetchInterval: 30000 });
  const queueQuery = useQuery({ queryKey: ['queue-summary', businessId], queryFn: () => getQueueSummary(businessId as string), enabled: Boolean(businessId), refetchInterval: 30000 });
  const appointmentQuery = useQuery({ queryKey: ['appointment-summary', businessId], queryFn: () => getAppointmentSummary(businessId as string), enabled: Boolean(businessId), refetchInterval: 30000 });
  const notificationQuery = useQuery({ queryKey: ['notification-summary', businessId], queryFn: () => getNotificationSummary(businessId as string), enabled: Boolean(businessId), refetchInterval: 30000 });
  const activityQuery = useQuery({ queryKey: ['today-activity', businessId], queryFn: () => getTodayActivity(businessId as string), enabled: Boolean(businessId), refetchInterval: 30000 });
  const summary = summaryQuery.data;
  const activityEvents = Array.isArray(activityQuery.data) ? activityQuery.data : [];

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" description="Operational visibility for queues, appointments, notifications, and today activity." />
      <BusinessSelector />
      {!businessId ? <Card className="text-sm text-slate-600">Select a business to view analytics.</Card> : null}
      {businessId ? <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Queues Today" value={summary?.totalQueuesToday ?? '...'} icon={ListOrdered} />
          <KpiCard label="Waiting Now" value={summary?.waitingQueues ?? '...'} icon={Activity} />
          <KpiCard label="Appointments Today" value={summary?.totalAppointmentsToday ?? '...'} icon={CalendarClock} />
          <KpiCard label="Pending Approvals" value={summary?.pendingAppointments ?? '...'} icon={CalendarClock} />
          <KpiCard label="Notifications Pending" value={summary?.pendingNotifications ?? '...'} icon={Bell} />
          <KpiCard label="Customers" value={summary?.totalCustomers ?? '...'} icon={Users} />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <SimpleBarChart title="Queue Status Today" data={queueQuery.data?.counts ?? {}} />
          <SimpleBarChart title="Appointment Status Today" data={appointmentQuery.data ?? {}} />
          <SimpleBarChart title="Notification Status" data={notificationQuery.data?.counts ?? {}} />
        </div>
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-950">Today Activity</h2>
          <div className="grid gap-3">
            {!activityQuery.isLoading && activityEvents.length === 0 ? <p className="text-sm text-slate-500">No activity found today.</p> : null}
            {activityEvents.map((event) => <div key={`${event.type}-${event.id}`} className="rounded-md border border-slate-200 p-3"><div className="flex justify-between gap-3 text-sm"><span className="font-medium text-slate-950">{event.type}</span><span className="text-slate-500">{new Date(event.createdAt).toLocaleTimeString()}</span></div><p className="text-sm text-slate-600">{event.title} {event.subtitle ? `- ${event.subtitle}` : ''}</p></div>)}
          </div>
        </Card>
      </> : null}
    </div>
  );
}
