import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaChartLine,
  FaPiggyBank,
  FaBell,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaMoon,
  FaSun,
  FaMoneyBillWave,
  FaHistory,
  FaEnvelope
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPolling, setNotificationPolling] = useState(null);
  const [invitationsCount, setInvitationsCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://savewise-mpzn.onrender.com/api';

  // Function to fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
  const response = await fetch(
  `${API_BASE}/notifications/unread-count`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchInvitationsCount = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    /* const response = await fetch('/api/invitations/pending', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }); */
    
   /*  if (response.ok) {
      const data = await response.json();
      setInvitationsCount(data.count || 0);
    } */
  } catch (error) {
    console.error('Error fetching invitations count:', error);
  }
}, []);

  useEffect(() => {
    // Load user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Check for dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Fetch initial notification count
    fetchUnreadCount();
    //fetchInvitationsCount();

    // Set up polling for real-time notification updates (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);
    const invitationsInterval = setInterval(fetchInvitationsCount, 60000);
    setNotificationPolling(interval);

    return () => {
      if (notificationPolling) {
        clearInterval(notificationPolling, invitationsInterval);
      }
    };
  }, [fetchUnreadCount, fetchInvitationsCount]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/plans', icon: <FaChartLine />, label: 'My Plans' },
    { path: '/plans/create', icon: <FaPiggyBank />, label: 'Create Plan' },
    { path: '/invitations', icon: <FaEnvelope />, label: 'Invitations', badge: invitationsCount },
    { path: '/deposits', icon: <FaMoneyBillWave />, label: 'Deposits' },
    { path: '/withdrawals', icon: <FaHistory />, label: 'Withdrawals' },
  ];

  const secondaryNavItems = [
    { 
      path: '/notifications', 
      icon: <FaBell />, 
      label: 'Notifications', 
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  // Function to handle notification click and mark as read
  const handleNotificationClick = () => {
    fetchUnreadCount(); // Refresh count
    navigate('/notifications');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <FaPiggyBank className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">SaveWise</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Smart Saving Plans</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Main
            </h3>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition ${
                      location.pathname === item.path
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-2">
              {secondaryNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={item.path === '/notifications' ? handleNotificationClick : undefined}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                      location.pathname === item.path
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 dark:text-white truncate">
                {user?.username || 'User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          
          <Link to="/dashboard" className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
              <FaPiggyBank className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">SaveWise</h1>
          </Link>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            <div className="relative">
              <Link 
                to="/notifications" 
                onClick={handleNotificationClick}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <FaPiggyBank className="text-white text-xl" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">SaveWise</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Smart Saving Plans</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-4">
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Main
                </h3>
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg transition ${
                          location.pathname === item.path
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Account
                </h3>
                <ul className="space-y-2">
                  {secondaryNavItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => {
                          setSidebarOpen(false);
                          if (item.path === '/notifications') {
                            handleNotificationClick();
                          }
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                          location.pathname === item.path
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-lg">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <FaSignOutAlt className="mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`lg:pl-64 pt-16 lg:pt-0 ${sidebarOpen ? 'blur-sm lg:blur-0' : ''}`}>
        <div className="min-h-screen">
          {children}
        </div>

        {/* Footer */}
<footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div className="mb-3 md:mb-0">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
            <FaPiggyBank className="text-white text-sm" />
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-white">SaveWise</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
          Smart saving plans for everyone
        </p>
      </div>
      
      <div className="flex items-center space-x-6">
        <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs">
          Terms
        </Link>
        <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs">
          Privacy
        </Link>
        <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs">
          Contact
        </Link>
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
      <p className="text-gray-500 dark:text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} SaveWise. All rights reserved.
        <span className="block md:inline mt-1 md:mt-0 md:ml-2">
          Designed and developed by{" "}
          <a 
            href="https://www.linkedin.com/in/denwit-shalupa-6a1b663a/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Denwit
          </a>
        </span>
        <span className="block md:inline mt-1 md:mt-0 md:ml-2">
          Powered By{" "}
          <a 
            href="https://vertexvetures.com/index.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Vertex Ventures
          </a>
        </span>
      </p>
    </div>
  </div>
</footer>
      </main>
    </div>
  );
};

export default Layout;
