import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  LayoutList,
  Map,
  Bell,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Search,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

function FeedSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { to: '/feed', label: 'Community Feed', Icon: LayoutList },
    { to: '/report', label: 'Report Issue', Icon: PlusCircle },
    { to: '/map', label: 'Civic Map', Icon: Map },
    { to: '/track', label: 'Track Complaint', Icon: Search },
    { to: '/notifications', label: 'Notifications', Icon: Bell },
    { to: '/ai', label: 'AI Intelligence', Icon: Sparkles },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-surface-border hidden lg:flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-surface-border">
        <Link to="/feed" className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg text-ink tracking-tight">
            CivicConnect <span className="text-primary-600">AI</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive(to)
                ? 'bg-primary-50 text-primary-700'
                : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(to) ? 'text-primary-600' : 'text-ink-muted'}`} />
            <span>{label}</span>
          </Link>
        ))}

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive('/admin')
                ? 'bg-primary-50 text-primary-700'
                : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-surface-border space-y-1">
        <Link
          to="/help"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-ink-muted" />
          <span>Help</span>
        </Link>
      </div>
    </aside>
  );
}

export default FeedSidebar;
