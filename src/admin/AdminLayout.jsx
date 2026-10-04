import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/reservations', label: 'Reservations' },
  { to: '/admin/menu-items', label: 'Menu Items' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/branches', label: 'Branches & Hours' },
  { to: '/admin/feedbacks', label: 'Feedbacks' },
  { to: '/admin/contacts', label: 'Contact Messages' },
  { to: '/admin/reports', label: 'Reports' },
];

const AdminLayout = ({ children }) => {
  const { notifications, unreadCount, markAllRead, clearNotifications } =
    useNotifications();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bellOpen, setBellOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = (
    <>
      <div className="px-6 py-6 border-b border-gray-800">
        <Link to="/admin" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-serif font-bold text-white">
            R
          </span>
          <div>
            <p className="font-serif font-bold text-white tracking-wide">Admin Panel</p>
            <p className="text-[11px] text-gray-500 tracking-widest uppercase">Restaurant</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Admin sections">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-4 py-3 lg:py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800 space-y-1 safe-bottom lg:pb-4">
        <Link
          to="/"
          className="block px-4 py-3 lg:py-2.5 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 lg:py-2.5 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div dir="ltr" className="min-h-screen bg-gray-100">
      {/* Desktop sidebar (≥1024px) — unchanged */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-300 flex-col">
        {SidebarContent}
      </aside>

      {/* Mobile drawer (<1024px) */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation menu"
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-gray-900 text-gray-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {SidebarContent}
        </aside>
      </div>

      <main className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Open admin navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span className="lg:hidden font-serif font-bold text-gray-900 tracking-wide truncate">
            Admin Panel
          </span>

          <div className="relative ml-auto">
            <button
              onClick={() => {
                setBellOpen((open) => !open);
                if (bellOpen) markAllRead();
              }}
              className="relative p-2 -mr-2 sm:mr-0 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors touch-manipulation"
              aria-label="Notifications"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-serif font-bold text-gray-900">Notifications</p>
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-gray-400">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 ${
                          n.read ? 'opacity-60' : 'bg-amber-50/40'
                        }`}
                      >
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                          {n.type.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {n.time.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
