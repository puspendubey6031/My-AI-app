
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Trash2, Bell } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: 'user' | 'payment' | 'system';
  is_read: boolean;
  created_at: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'user' | 'payment' | 'system'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from('notifications').select('*');

    if (filter !== 'all') {
      query = query.eq('type', filter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      toast({
        title: "Error fetching notifications",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleToggleRead = async (id: string, is_read: boolean) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: !is_read })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating notification",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Notification marked as ${!is_read ? 'read' : 'unread'}.`,
      });
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        toast({
          title: "Error deleting notification",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Notification deleted.",
        });
        fetchNotifications();
      }
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All</option>
            <option value="user">User</option>
            <option value="payment">Payment</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {loading && notifications.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && !error && filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No Notifications</h3>
            <p className="text-gray-500 mt-2">There are no notifications to display.</p>
        </div>
      )}

      {!loading && !error && filteredNotifications.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map(notification => (
              <li
                key={notification.id}
                className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between ${notification.is_read ? 'bg-gray-50' : ''}`}
              >
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        notification.type === 'user' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'payment' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {notification.type}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-gray-800 ${notification.is_read ? 'text-gray-500' : ''}`}>
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRead(notification.id, notification.is_read)}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {notification.is_read ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-blue-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 rounded-full hover:bg-red-100 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;
