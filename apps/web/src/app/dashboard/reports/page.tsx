'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState, LoadingState } from '@/components/ui/state';
import { getDailyAppointmentReport, getDailyQueueReport, getNotificationReport, getStaffActivityReport } from '@/features/reports/reports.api';
import { useBusinessStore } from '@/store/business-store';

function TableCard<T extends object>({ title, rows }: { title: string; rows?: T[] }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const columns = safeRows[0] ? Object.keys(safeRows[0] as Record<string, unknown>) : [];
  return <Card className="overflow-auto"><h2 className="mb-3 text-base font-semibold text-slate-950">{title}</h2>{!rows ? <LoadingState message="Loading report..." /> : safeRows.length === 0 ? <EmptyState title="No rows" /> : <table className="w-full text-left text-sm"><thead><tr>{columns.map((column) => <th key={column} className="border-b border-slate-200 p-2 text-slate-600">{column}</th>)}</tr></thead><tbody>{safeRows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column} className="border-b border-slate-100 p-2 text-slate-800">{String((row as Record<string, unknown>)[column] ?? '')}</td>)}</tr>)}</tbody></table>}</Card>;
}

export default function ReportsPage() {
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const filters = { businessId: businessId as string, startDate, endDate, branchId: branchId || undefined, serviceId: serviceId || undefined };
  const queueReport = useQuery({ queryKey: ['queue-report', filters], queryFn: () => getDailyQueueReport(filters), enabled: Boolean(businessId) });
  const appointmentReport = useQuery({ queryKey: ['appointment-report', filters], queryFn: () => getDailyAppointmentReport(filters), enabled: Boolean(businessId) });
  const staffReport = useQuery({ queryKey: ['staff-report', filters], queryFn: () => getStaffActivityReport(filters), enabled: Boolean(businessId) });
  const notificationReport = useQuery({ queryKey: ['notification-report', filters], queryFn: () => getNotificationReport(filters), enabled: Boolean(businessId) });
  const refresh = () => { queueReport.refetch(); appointmentReport.refetch(); staffReport.refetch(); notificationReport.refetch(); };

  return <div className="grid gap-6"><PageHeader title="Reports" description="Simple operational reports for queues, appointments, staff activity, and notifications." /><BusinessSelector />{!businessId ? <EmptyState title="Select a business first" /> : <><Card className="grid gap-3 md:grid-cols-5"><Input label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><Input label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /><Input label="Branch ID" value={branchId} onChange={(event) => setBranchId(event.target.value)} /><Input label="Service ID" value={serviceId} onChange={(event) => setServiceId(event.target.value)} /><Button className="self-end" onClick={refresh}><RefreshCcw className="h-4 w-4" /> Refresh</Button></Card><div className="grid gap-6"><TableCard title="Queue Report" rows={queueReport.data} /><TableCard title="Appointment Report" rows={appointmentReport.data} /><TableCard title="Notification Report" rows={notificationReport.data} /><TableCard title="Staff Activity" rows={staffReport.data} /></div></>}</div>;
}
