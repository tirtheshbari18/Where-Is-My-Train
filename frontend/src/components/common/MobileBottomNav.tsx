// frontend/src/components/common/MobileBottomNav.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Ticket, Bell, FileText } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const items = [
    { name: 'HOME', path: '/', icon: Home },
    { name: 'SEARCH', path: '/search', icon: Search },
    { name: 'PNR', path: '/pnr', icon: FileText },
    { name: 'TICKETS', path: '/tickets', icon: Ticket },
    { name: 'ALERTS', path: '/alerts', icon: Bell },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-1 py-1 shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition duration-150 active:scale-95 ${
                isActive
                  ? 'text-[#0A58CA] dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.name === 'ALERTS' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
