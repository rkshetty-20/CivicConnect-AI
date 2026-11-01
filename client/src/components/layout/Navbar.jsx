// src/components/layout/Navbar.jsx
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';
import { Sun, Moon } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/issues', label: 'Explore Issues' },
  { to: '/report', label: 'Report Issue' },
  { to: '/assistant', label: 'AI Assistant' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/notifications', label: 'Notifications' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 mr-8">
          <img
            src="/logo192.png"
            alt="CivicConnect AI"
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold text-xl text-gray-800 dark:text-gray-100">
            CivicConnect AI
          </span>
        </Link>
        {/* Nav Links */}
        <div className="flex-1 hidden md:flex space-x-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${{
                  true: 'bg-primary-100 text-primary-700',
                  false: 'text-gray-600 hover:bg-primary-50 hover:text-primary-800'
                }[isActive]}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {/* Auth buttons (placeholder) */}
          <Link
            to="/login"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
