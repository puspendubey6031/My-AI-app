import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// Define types for user, payment, and video history
type User = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  credits: number;
  is_blocked: boolean;
  created_at: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  plan_name: string;
  created_at: string;
};

type VideoHistory = {
  id: string;
  video_title: string;
  status: string;
  created_at: string;
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {message}</span>
    </div>
);

const UserDetail: React.FC<{ params: { id: string } }> = ({ params }) => {
    const { id } = params;
    const [, setLocation] = useLocation();

    const [user, setUser] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [videos, setVideos] = useState<VideoHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editable fields state
    const [credits, setCredits] = useState(0);
    const [plan, setPlan] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [userRes, paymentsRes, videosRes] = await Promise.all([
                supabase.from('users').select('*').eq('id', id).single(),
                supabase.from('payments').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
                supabase.from('video_history').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(5)
            ]);

            if (userRes.error) throw new Error(userRes.error.message);
            if (paymentsRes.error) throw new Error(paymentsRes.error.message);
            if (videosRes.error) throw new Error(videosRes.error.message);

            setUser(userRes.data);
            setPayments(paymentsRes.data);
            setVideos(videosRes.data);

            // Initialize editable fields
            setCredits(userRes.data.credits || 0);
            setPlan(userRes.data.plan || 'free');

        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to fetch user details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('users')
                .update({ credits, plan })
                .eq('id', user.id);
            if (error) throw error;
            toast.success('User details updated successfully!');
            fetchData(); // Refresh data
        } catch (err: any) {
            toast.error(`Update failed: ${err.message}`);
        }
    };

    const toggleBlock = async () => {
        if (!user) return;
        try {
            const newStatus = !user.is_blocked;
            const { error } = await supabase
                .from('users')
                .update({ is_blocked: newStatus })
                .eq('id', user.id);
            if (error) throw error;
            toast.success(`User has been ${newStatus ? 'blocked' : 'unblocked'}.`);
            setUser({ ...user, is_blocked: newStatus });
        } catch (err: any) {
            toast.error(`Action failed: ${err.message}`);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} />;
    if (!user) return <div>User not found.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => setLocation('/admin/users')} className="mb-6 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors">
                &larr; Back to Users
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Info & Actions */}
                <div className="lg:col-span-1 bg-white shadow-lg rounded-lg p-6 h-fit">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">{user.name || 'Anonymous'}</h2>
                        <p className="text-gray-600">{user.email}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Plan</label>
                            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option>free</option>
                                <option>starter</option>
                                <option>creator</option>
                                <option>premium</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Credits</label>
                            <input type="number" value={credits} onChange={(e) => setCredits(parseInt(e.target.value))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                        </div>
                        <div className="flex justify-between items-center">
                             <p className={`px-3 py-1 rounded-full text-sm font-semibold ${user.is_blocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                {user.is_blocked ? 'Blocked' : 'Active'}
                            </p>
                            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3">
                        <button onClick={handleUpdate} className="w-full bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600">Save Changes</button>
                        <button onClick={toggleBlock} className={`w-full text-white px-4 py-2 rounded shadow ${user.is_blocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                            {user.is_blocked ? 'Unblock User' : 'Block User'}
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white shadow-lg rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Recent Payments</h3>
                        <ul>
                            {payments.length > 0 ? payments.map(p => (
                                <li key={p.id} className="flex justify-between items-center border-b py-2">
                                    <span>{p.plan_name} - <span className={`font-semibold ${p.status === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>{p.status}</span></span>
                                    <span>${p.amount.toFixed(2)} on {new Date(p.created_at).toLocaleDateString()}</span>
                                </li>
                            )) : <p>No payment history.</p>}
                        </ul>
                    </div>
                    
                    <div className="bg-white shadow-lg rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Recent Videos</h3>
                         <ul>
                            {videos.length > 0 ? videos.map(v => (
                                <li key={v.id} className="flex justify-between items-center border-b py-2">
                                    <span>{v.video_title || 'Untitled'}</span>
                                    <span className={`font-semibold ${v.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>{v.status}</span>
                                </li>
                            )) : <p>No video history.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;