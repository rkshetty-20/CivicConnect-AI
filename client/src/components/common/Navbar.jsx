import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Map, PlusCircle, LayoutList, LogOut, User, BarChart3, Menu, X, Bell, Trophy } from 'lucide-react';
import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount = 0 } = useSocket() || {};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const citizenLinks = [
    { to: '/feed', label: 'Issue Feed', Icon: LayoutList },
    { to: '/map', label: 'Map', Icon: Map },
    { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
    { to: '/report', label: 'Report Issue', Icon: PlusCircle },
  ];

  const officerLinks = [
    { to: '/officer', label: 'Dashboard', Icon: BarChart3 },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Panel', Icon: BarChart3 },
  ];

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'officer' ? officerLinks :
    citizenLinks;

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-xl shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            CivicConnect <span className="text-teal-400">AI</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {links.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                isActive(to)
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Notification Bell */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <User className="w-4 h-4" />
            <span className="max-w-[120px] truncate">{user?.name}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {links.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(to)
                  ? 'bg-teal-500/15 text-teal-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="border-t border-slate-800 pt-2 mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
