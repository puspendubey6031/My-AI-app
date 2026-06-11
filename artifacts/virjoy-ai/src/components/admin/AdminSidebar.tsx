import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-xl">VirJoy AI Admin</div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavLink to="/admin/dashboard" className="block px-4 py-2 rounded hover:bg-gray-700">Dashboard</NavLink>
        <NavLink to="/admin/users" className="block px-4 py-2 rounded hover:bg-gray-700">Users</NavLink>
        <NavLink to="/admin/plans" className="block px-4 py-2 rounded hover:bg-gray-700">Plans</NavLink>
        <NavLink to="/admin/payments" className="block px-4 py-2 rounded hover:bg-gray-700">Payments</NavLink>
        <NavLink to="/admin/history" className="block px-4 py-2 rounded hover:bg-gray-700">History</NavLink>
        <NavLink to="/admin/subscriptions" className="block px-4 py-2 rounded hover:bg-gray-700">Subscriptions</NavLink>
        <NavLink to="/admin/banner-ads" className="block px-4 py-2 rounded hover:bg-gray-700">Banner Ads</NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
