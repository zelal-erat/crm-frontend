import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', label: 'Kontrol Paneli', icon: '📊' },
    { path: '/customers', label: 'Müşteriler', icon: '👥' },
    { path: '/invoices', label: 'Faturalar', icon: '📄' },
    { path: '/services', label: 'Hizmetler', icon: '🔧' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bg-gray-800 text-white w-64 h-screen p-4 flex flex-col overflow-hidden">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">CRM Sistemi</h1>
        {user && (
          <p className="text-sm text-gray-400 mt-2">
            Hoş geldin, {user.name || user.email}
          </p>
        )}
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <span className="mr-3">🚪</span>
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
