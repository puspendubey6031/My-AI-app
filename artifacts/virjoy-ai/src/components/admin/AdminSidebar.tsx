import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, CreditCard, DollarSign, Clock, Star, Image, Bell } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-xl">VirJoy AI Admin</div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavLink to="/admin/dashboard" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <Home className="w-5 h-5 mr-2" />
          Dashboard
        </NavLink>
        <NavLink to="/admin/users" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <Users className="w-5 h-5 mr-2" />
          Users
        </NavLink>
        <NavLink to="/admin/plans" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <CreditCard className="w-5 h-5 mr-2" />
          Plans
        </NavLink>
        <NavLink to="/admin/payments" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <DollarSign className="w-5 h-5 mr-2" />
          Payments
        </NavLink>
        <NavLink to="/admin/history" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <Clock className="w-5 h-5 mr-2" />
          History
        </NavLink>
        <NavLink to="/admin/subscriptions" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <Star className="w-5 h-5 mr-2" />
          Subscriptions
        </NavLink>
        <NavLink to="/admin/banner-ads" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <Image className="w-5 h-5 mr-2" />
          Banner Ads
        </NavLink>
        <NavLink to="/admin/notifications" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
