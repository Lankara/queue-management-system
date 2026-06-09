'use client';

import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  MessageCircle,
  QrCode,
  Settings,
  TimerReset,
  Users
} from 'lucide-react';
import { SidebarNavItem } from './sidebar-nav-item';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/businesses', label: 'Businesses', icon: Building2 },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/queues', label: 'Queues', icon: ListOrdered },
  { href: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { href: '/dashboard/appointments', label: 'Appointments', icon: CalendarClock },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/whatsapp', label: 'WhatsApp Simulator', icon: MessageCircle },
  { href: '/dashboard/delays', label: 'Delays', icon: TimerReset },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings }
];

export function Sidebar({ open }: { open: boolean }) {
  return (
    <aside
      className={
        open
          ? 'fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white p-4 lg:static lg:block'
          : 'hidden border-r border-slate-200 bg-white p-4 lg:static lg:block lg:w-72'
      }
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
          <Gauge className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Queue Manager</p>
          <p className="text-xs text-slate-500">Admin Console</p>
        </div>
      </div>
      <nav className="grid gap-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  );
}
