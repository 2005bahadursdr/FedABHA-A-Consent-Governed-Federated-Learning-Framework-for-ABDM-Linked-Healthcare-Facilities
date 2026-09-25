import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, ShieldCheck, Building2, Network, Brain, ScrollText, 
  Menu, X, Sun, Moon, Lock, UserCheck, ShieldAlert, LogOut, ChevronDown 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/dashboard', icon: Activity, label: 'Dashboard' },
  { path: '/local-hospital', icon: Building2, label: 'Local Hospital' },
  { path: '/consent', icon: ShieldCheck, label: 'Consent' },
  { path: '/hospitals', icon: Building2, label: 'Hospitals' },
  { path: '/fl', icon: Network, label: 'Federated Learning' },
  { path: '/predictions', icon: Brain, label: 'Predictions' },
  { path: '/audit', icon: ScrollText, label: 'Audit Logs' },
  { path: '/login', icon: Lock, label: 'Login Gateway' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, setIsAuthModalOpen, logout, isAuditor } = useAuth();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fedabha_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('fedabha_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getRoleBadgeStyle = () => {
    if (!user) return 'bg-slate-700 text-slate-200 border-slate-600';
    if (user.role === 'admin') return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
    if (user.role === 'hospital') return 'bg-blue-950/60 text-blue-300 border-blue-500/40';
    return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
  };

  return (
    <div className="flex min-h-screen lg:h-screen bg-dark-900 text-slate-100 font-sans overflow-x-hidden w-full max-w-full">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-slate-700 flex flex-col transform transition-transform duration-300 ease-in-out shrink-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
          <div className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-100 bg-clip-text text-transparent">
            FedABHA-X
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-100 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card in Drawer */}
        {user && (
          <div className="p-3 mx-3 mt-3 bg-dark-900/80 rounded-xl border border-slate-700/80 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-200 truncate">{user.name}</span>
              <span className={cn("inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border mt-0.5", getRoleBadgeStyle())}>
                {user.role_title}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-primary-500/10 text-primary-400 font-semibold" : "text-slate-400 hover:bg-dark-700 hover:text-slate-100"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-700/80 text-[11px] text-slate-400 text-center leading-relaxed">
          <p className="font-medium text-slate-300">
            © {new Date().getFullYear()} FedABHA-X | L.B.S.
          </p>
          <span className="font-mono text-emerald-400 text-[10px] block mt-0.5">
            v1.0 Operational
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:min-h-0 overflow-y-auto lg:overflow-hidden">
        <header className="sticky top-0 z-30 h-16 bg-dark-800/95 backdrop-blur-md border-b border-slate-700 flex items-center px-3 sm:px-6 lg:px-8 shadow-sm justify-between shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 pr-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-300 hover:text-slate-100 p-1.5 bg-dark-700 border border-slate-600 rounded-lg transition-colors shrink-0"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm sm:text-lg font-semibold text-slate-200 truncate">
              <span className="hidden sm:inline">System Monitoring Dashboard</span>
              <span className="sm:hidden">FedABHA-X</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* RBAC Role Switcher & Active Profile Dropdown Button */}
            {user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className={cn(
                  "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold transition shadow-sm",
                  getRoleBadgeStyle()
                )}
                title="Click to Switch RBAC Role"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{user.name} ({user.role_title})</span>
                <span className="hidden sm:inline md:hidden">{user.role_title}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-dark-700 hover:bg-slate-700 text-amber-400 border border-slate-600 transition-colors shadow-sm shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <span className="flex items-center text-xs sm:text-sm text-green-400 font-medium bg-dark-800 p-1.5 rounded-lg border border-slate-700 sm:border-transparent sm:p-0">
              <span className="w-2 h-2 rounded-full bg-green-500 sm:mr-2 animate-pulse shrink-0"></span>
              <span className="hidden sm:inline">Network Active</span>
            </span>
          </div>
        </header>

        {/* Auditor Read-Only Banner Notice */}
        {isAuditor() && (
          <div className="bg-amber-950/60 border-b border-amber-500/40 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-300 shrink-0">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Auditor Mode Active:</strong> Read-only access enabled for consent history, revocations, FL logs, and security audit trail.
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="underline hover:text-amber-100 font-medium transition shrink-0 ml-2"
            >
              Switch Role
            </button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-900 p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-0">
          <div className="space-y-6">
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-700/60 text-center text-xs text-slate-400 font-sans flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} FedABHA-X | L.B.S.</span>
            <span className="font-mono text-emerald-400 text-[11px]">v1.0 Operational</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
