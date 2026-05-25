'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarNavItem({ href, label, icon: Icon }: SidebarNavItemProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      className={clsx(
        'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition',
        active ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
      )}
      href={href}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
