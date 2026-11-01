import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutList, PlusCircle, Map, Bell } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: '/feed', label: 'Feed', Icon: LayoutList },
    { to: '/map', label: 'Map', Icon: Map },
    { to: '/report', label: 'Report', Icon: PlusCircle, isPrimary: true },
    { to: '/notifications', label: 'Alerts', Icon: Bell },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border z-50 pb-safe shadow-card">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, label, Icon, isPrimary }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              isPrimary ? '-mt-5' : ''
            }`}
          >
            {isPrimary ? (
              <div className="bg-primary-600 w-14 h-14 rounded-full flex items-center justify-center shadow-card-hover text-white">
                <Icon className="w-6 h-6" />
              </div>
            ) : (
              <>
                <Icon className={`w-5 h-5 mb-0.5 ${isActive(to) ? 'text-primary-600' : 'text-ink-muted'}`} />
                <span className={`text-[10px] font-semibold ${isActive(to) ? 'text-primary-600' : 'text-ink-muted'}`}>
                  {label}
                </span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
