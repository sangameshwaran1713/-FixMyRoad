import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, LogOut, LayoutDashboard, LogIn, UserPlus, Bell, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyNotificationsApi, markNotificationReadApi } from '../services/notificationService';

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getMyNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      // Ignore polling errors silently
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBellDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      try {
        await markNotificationReadApi(n._id);
        setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
      } catch (err) {
        // Continue navigation
      }
    }
    setShowBellDropdown(false);
    if (n.relatedComplaintId) {
      // If related complaint document is populated object or string ID
      const cid = typeof n.relatedComplaintId === 'object' ? n.relatedComplaintId.complaintId : null;
      if (cid) {
        navigate(`/citizen/complaints/${cid}`);
      } else {
        navigate('/citizen/complaints');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'SUPER_ADMIN') return '/admin/dashboard';
    if (user.role === 'MUNICIPALITY_ADMIN') return '/municipality/dashboard';
    return '/citizen/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 glow-gradient">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                FixMyRoad
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="btn-nav-notifications"
                    type="button"
                    onClick={() => setShowBellDropdown(!showBellDropdown)}
                    className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 text-cyan-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-950 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showBellDropdown && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-slate-800 bg-slate-900/95 shadow-2xl z-50 overflow-hidden text-xs">
                      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                        <span className="font-bold text-white">Notifications</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                          {unreadCount} unread
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500">No notifications received yet.</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3.5 hover:bg-slate-800/60 transition-all cursor-pointer space-y-1 ${
                                !n.read ? 'bg-cyan-500/5' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-bold ${!n.read ? 'text-cyan-400' : 'text-slate-300'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={getDashboardPath()}
                  className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-slate-200">{user.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400">
                    {user.role}
                  </span>
                </div>

                <button
                  id="btn-nav-logout"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  id="link-nav-login"
                  to="/login"
                  className="flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>

                <Link
                  id="link-nav-register"
                  to="/register"
                  className="flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:scale-[1.02] transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
          <p>© {new Date().getFullYear()} FixMyRoad — AI-Powered Road Damage Reporting Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
