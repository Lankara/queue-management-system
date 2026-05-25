import { ArrowRight, CalendarClock, HeartPulse, MessageCircle, Monitor, QrCode, Scissors, ShieldCheck, Sparkles, Store, Users } from 'lucide-react';
import Link from 'next/link';

const businessTypes = [
  { title: 'Medical Center', icon: HeartPulse, text: 'Patient profiles, appointment approval, doctor delay handling, and queue flow.' },
  { title: 'Doctor / Channeling', icon: CalendarClock, text: 'Appointments, public booking requests, and approval-led queue assignment.' },
  { title: 'Barber Shop', icon: Scissors, text: 'Simple customer queues, QR joining, and current-number operations.' },
  { title: 'Beauty Parlour', icon: Sparkles, text: 'Service selection, customer profiles, bookings, and notification logs.' },
  { title: 'Salon', icon: Users, text: 'Multi-service queue and appointment operations for daily walk-ins.' },
  { title: 'Service Shop', icon: Store, text: 'Reusable queue and appointment workflows for ordinary service counters.' }
];

const features = [
  { title: 'QR queue booking', icon: QrCode, text: 'Customers scan a shared business link and join the correct queue from their phone.' },
  { title: 'Appointment booking', icon: CalendarClock, text: 'Customers request a time, staff approve later, and approved appointments receive queue numbers.' },
  { title: 'WhatsApp-ready', icon: MessageCircle, text: 'Outbound notification logs, provider foundations, inbound webhook, and simulator are already prepared.' },
  { title: 'Tenant separation', icon: ShieldCheck, text: 'Every operation stays scoped by business_id, so each owner sees only their own business.' },
  { title: 'Medical workflows', icon: HeartPulse, text: 'Optional medical profile fields, delay propagation, and patient-oriented appointment status.' },
  { title: 'Hardware display future', icon: Monitor, text: 'Current serving numbers are already modeled for display screens in a later phase.' }
];

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-950">
      <section
        className="relative min-h-[88vh] bg-cover bg-center text-white"
        style={{ backgroundImage: "linear-gradient(rgba(2,6,23,.78), rgba(2,6,23,.68)), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1800&q=80')" }}
      >
        <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col px-6 py-6">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-500 text-slate-950"><Store className="h-5 w-5" /></span>
              Queue Management System
            </div>
            <div className="flex gap-2">
              <Link className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href="/login">Login</Link>
              <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/register">Start Free</Link>
            </div>
          </nav>

          <div className="grid flex-1 content-center gap-8 py-16">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-teal-200">One platform. Separate portal for every business.</p>
              <h1 className="text-5xl font-semibold tracking-normal md:text-7xl">Queue Management System</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Run QR queues, appointments, customer profiles, medical channeling workflows, WhatsApp notifications, and operational dashboards from one central SaaS platform.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-md bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950" href="/register">Register Business <ArrowRight className="h-4 w-4" /></Link>
                <Link className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white" href="/login">Login</Link>
                <a className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white" href="mailto:demo@example.com">View Demo / Contact</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-teal-700">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold">Start once, serve every customer channel</h2>
        </div>
        {['Create your owner account and business portal.', 'Share QR links or accept appointment requests.', 'Operate queues, approvals, delays, and notifications from the dashboard.'].map((step, index) => (
          <div key={step} className="rounded-lg border border-slate-200 p-5">
            <span className="text-sm font-semibold text-teal-700">0{index + 1}</span>
            <p className="mt-3 text-base font-medium text-slate-900">{step}</p>
          </div>
        ))}
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-teal-700">Features</p>
            <h2 className="mt-2 text-3xl font-semibold">Built for healthcare, beauty, grooming, and service counters</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5"><feature.icon className="h-6 w-6 text-teal-700" /><h3 className="mt-4 font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Business types supported</p>
            <h2 className="mt-2 text-3xl font-semibold">One shared SaaS platform, many business workflows</h2>
          </div>
          <Link className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/register">Create your portal <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businessTypes.map((item) => <div key={item.title} className="rounded-lg border border-slate-200 p-5"><item.icon className="h-6 w-6 text-teal-700" /><h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></div>)}
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_.6fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-200">Pricing placeholder</p>
            <h2 className="mt-2 text-3xl font-semibold">Start with the operational platform, scale into custom domains and hardware later.</h2>
            <p className="mt-4 text-slate-300">Separate websites and servers are not needed for each business. Each tenant gets its own portal and public queue links inside the same hosted system.</p>
          </div>
          <Link className="inline-flex justify-center rounded-md bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950" href="/register">Start Free</Link>
        </div>
      </section>
    </main>
  );
}
