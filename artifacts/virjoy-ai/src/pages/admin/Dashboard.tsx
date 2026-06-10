timport React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// Types
type Stats = {
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    totalRevenue: number;
};

type RecentPayment = {
    id: string;
    amount: number;
    created_at: string;
    users: { email: string } | null; // User can be null
};

// Skeleton Components
const StatCardSkeleton: React.FC = () => (
    <div className="bg-gray-200 shadow rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-10 bg-gray-300 rounded w-1/2"></div>
    </div>
);

const RecentPaymentsSkeleton: React.FC = () => (
    <div className="mt-8">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="bg-gray-200 shadow rounded-lg p-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-300">
                    <div className="h-5 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-5 bg-gray-300 rounded w-1/6"></div>
                </div>
            ))}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersCount, activeUsersCount, premiumUsersCount, revenueData, paymentsData] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', false),
                supabase.from('users').select('*', { count: 'exact', head: true }).in('plan', ['premium', 'creator']),
                supabase.from('payments').select('amount').eq('status', 'success'),
                supabase.from('payments').select('id, amount, created_at, users(email)').order('created_at', { ascending: false }).limit(5)
            ]);

            if (usersCount.error) throw usersCount.error;
            if (activeUsersCount.error) throw activeUsersCount.error;
            if (premiumUsersCount.error) throw premiumUsersCount.error;
            if (revenueData.error) throw revenueData.error;
            if (paymentsData.error) throw paymentsData.error;

            const totalRevenue = revenueData.data?.reduce((sum, item) => sum + item.amount, 0) || 0;

            setStats({
                totalUsers: usersCount.count ?? 0,
                activeUsers: activeUsersCount.count ?? 0,
                premiumUsers: premiumUsersCount.count ?? 0,
                totalRevenue: totalRevenue,
            });
            
            setRecentPayments(paymentsData.data as RecentPayment[]);

        } catch (err: any) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message);
            toast.error('Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div>
                 <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
                <RecentPaymentsSkeleton />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded">Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-600">Total Users</h2>
                    <p className="text-3xl font-bold">{stats?.totalUsers ?? 0}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-600">Active Users</h2>
                    <p className="text-3xl font-bold">{stats?.activeUsers ?? 0}</p>
                </div>
                 <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-600">Premium Users</h2>
                    <p className="text-3xl font-bold">{stats?.premiumUsers ?? 0}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-600">Total Revenue</h2>
                    <p className="text-3xl font-bold">{stats?.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {recentPayments && recentPayments.length > 0 ? (
                            recentPayments.map(payment => (
                                <li key={payment.id} className="px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{payment.users?.email ?? 'Unknown User'}</p>
                                        <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-lg font-semibold text-green-600">{payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                </li>
                            ))
                        ) : (
                            <li className="px-6 py-12 text-center text-gray-500">No recent payments found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
