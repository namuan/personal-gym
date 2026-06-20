import { Outlet, NavLink } from 'react-router-dom';

/**
 * Persistent shell: header + main content area. Responsive — single column
 * on mobile, with a wider centred column on tablet/desktop. Navigation is
 * a bottom-bar on mobile and a top-bar on larger screens, per the
 * masterplan's "large readable text, generous tap targets" guidance.
 */
export default function Layout() {
  const navItems = [
    { to: '/', label: 'Home', icon: HomeIcon, end: true },
    { to: '/plan', label: 'Plan', icon: PlanIcon },
    { to: '/session', label: 'Workout', icon: WorkoutIcon },
    { to: '/history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Personal Gym
            </span>
          </div>
          <nav className="hidden gap-1 sm:flex" aria-label="Primary">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"
        aria-label="Primary mobile"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium ${
                    isActive ? 'text-brand-700' : 'text-slate-500'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="#0f172a" />
      <path
        d="M16 24h4v16h-4a2 2 0 0 1-2-2V26a2 2 0 0 1 2-2Zm28 0h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4V24ZM22 28h20v8H22v-8Z"
        fill="#38bdf8"
      />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function PlanIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 11h6M9 15h4M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function WorkoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="M18 22 4 8l3-3 14 14Z" />
    </svg>
  );
}

function HistoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
