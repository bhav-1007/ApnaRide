import { NavLink, Link } from 'react-router-dom';
import { LogOut, Car, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fullName } from '../utils/format';

export const Brand = ({ to = '/' }) => (
  <Link to={to} className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-cng text-peeli" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="20" height="20">
        <path d="M8 21l6-12h4l6 12h-4l-1.2-2.6h-5.6L12 21H8zm7.4-5.6h1.2L16 14l-.6 1.4z" fill="currentColor" />
      </svg>
    </span>
    ApnaRide
  </Link>
);

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 font-semibold transition-colors duration-150 ${
    isActive ? 'bg-cng-soft text-cng-dark' : 'text-muted hover:text-ink'
  }`;

const mobileTabClass = ({ isActive }) =>
  `flex flex-1 flex-col items-center justify-center py-1 text-xs font-semibold transition-colors duration-150 ${
    isActive ? 'text-cng' : 'text-muted hover:text-ink'
  }`;

export default function Shell({ children }) {
  const { account, role, signOut } = useAuth();
  const home = role === 'captain' ? '/captain' : '/ride';
  const rideLabel = role === 'captain' ? 'Drive' : 'Book a ride';

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-mist">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Brand to={home} />
          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex sm:gap-1" aria-label="Main">
            <NavLink to={home} end className={linkClass}>
              {role === 'captain' ? 'Drive' : 'Book a ride'}
            </NavLink>
            <NavLink to={`${home}/history`} className={linkClass}>
              History
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm font-medium text-muted md:inline">{fullName(account)}</span>
          <button
            className="btn btn-ghost min-h-[38px] px-2.5 sm:px-3 text-sm"
            onClick={signOut}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-0 flex-1 overflow-hidden pb-14 sm:pb-0">{children}</main>

      {/* Mobile Bottom Navigation Bar (thumb reach zone) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t border-line bg-white pb-safe sm:hidden"
        aria-label="Mobile Navigation"
      >
        <NavLink to={home} end className={mobileTabClass}>
          <Car size={20} />
          <span className="mt-0.5">{rideLabel}</span>
        </NavLink>
        <NavLink to={`${home}/history`} className={mobileTabClass}>
          <HistoryIcon size={20} />
          <span className="mt-0.5">History</span>
        </NavLink>
      </nav>
    </div>
  );
}
