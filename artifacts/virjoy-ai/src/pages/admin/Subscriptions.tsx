import React from 'react';

const Subscriptions: React.FC = () => {
  // Placeholder data - replace with Firestore data
  const subscriptions = [
    { id: '1', userId: 'user1', plan: 'Creator', status: 'Active', renewalDate: '2023-11-26' },
    { id: '2', userId: 'user2', plan: 'Premium', status: 'Active', renewalDate: '2023-11-25' },
    { id: '3', userId: 'user3', plan: 'Free', status: 'N/A', renewalDate: 'N/A' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Subscriptions</h1>
      <div className="bg-white shadow rounded-lg p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td className="px-6 py-4 whitespace-nowrap">{sub.userId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{sub.plan}</td>
                <td className="px-6 py-4 whitespace-nowrap">{sub.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{sub.renewalDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subscriptions;
