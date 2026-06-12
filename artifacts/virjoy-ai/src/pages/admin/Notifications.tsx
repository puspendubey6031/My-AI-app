import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

const AdminNotifications: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Here you would typically have a table for notifications
            // and you would insert the new notification into it.
            // For this example, we'll just simulate it.
            
            // const { error } = await supabase.from('notifications').insert([
            //     { title, message, created_at: new Date() },
            // ]);

            // if (error) throw error;

            console.log('Sending notification:', { title, message });
            await new Promise(res => setTimeout(res, 1000)); // Simulate network delay

            toast.success('Notification sent successfully!');
            setTitle('');
            setMessage('');

        } catch (error: any) {
            toast.error(`Error sending notification: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Send Notifications</h1>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter notification title"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="mb-8">
                        <label htmlFor="message" className="block text-lg font-medium text-gray-700 mb-2">Message</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter notification message..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            rows={6}
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors duration-200"
                        >
                            {isSubmitting ? 'Sending...' : 'Send to All Users'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminNotifications;
