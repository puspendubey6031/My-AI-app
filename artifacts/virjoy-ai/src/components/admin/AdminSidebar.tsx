import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Users, CreditCard, BarChart, Settings, Bell, Film } from 'lucide-react';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/plans', label: 'Plans', icon: BarChart },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/history', label: 'History', icon: Film },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminSidebar: React.FC = () => {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="h-20 flex items-center justify-center font-bold text-xl border-b border-gray-700">
        Admin Panel
      </div>
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {navLinks.map(link => {
            const isActive = location.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link href={link.href}>
                  <a className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>
                    <Icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
