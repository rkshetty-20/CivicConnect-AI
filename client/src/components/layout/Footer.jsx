// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

export default function Footer() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <footer className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div className="mb-4 md:mb-0">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            © {new Date().getFullYear()} CivicConnect AI. All rights reserved.
          </p>
        </div>
        <div className="flex space-x-4 mb-4 md:mb-0">
          <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:underline text-sm">Privacy</Link>
          <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:underline text-sm">Terms</Link>
          <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:underline text-sm">Contact</Link>
        </div>
        <div className="flex items-center space-x-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </footer>
  );
}
