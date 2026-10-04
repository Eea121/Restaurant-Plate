import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboardData } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatters';

const PIE_COLORS = ['#6b7280', '#22c55e', '#ef4444', '#9ca3af', '#3b82f6'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData({ lastDays: 7, months: 12 })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6" aria-hidden="true">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 space-y-3">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 space-y-4">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-[260px] w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const revenueByMonth = (data?.revenueByMonth || []).map((m) => ({
    name: `${m.month}/${String(m.year).slice(2)}`,
    Revenue: Number(m.revenue || 0),
    Orders: m.ordersCount || 0,
  }));
  const ordersByDay = (data?.ordersByDay || []).map((d) => ({
    name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Orders: d.ordersCount || 0,
    Revenue: Number(d.revenue || 0),
  }));
  const reservationStats = (data?.reservationStatistics || []).map((r) => ({
    name: r.status,
    value: r.count || 0,
  }));

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), to: '/admin/orders' },
    { label: 'Orders Today', value: stats.todayOrders, to: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pendingOrders, to: '/admin/orders' },
    { label: 'Reservations Today', value: stats.reservationsToday, to: '/admin/reservations' },
    { label: 'Total Users', value: stats.totalUsers, to: '/admin/users' },
    { label: 'Menu Items', value: stats.totalMenuItems, to: '/admin/menu-items' },
    { label: 'Branches', value: stats.totalBranches, to: '/admin/branches' },
    { label: 'Feedbacks', value: stats.totalFeedbacks, to: '/admin/feedbacks' },
    { label: 'Unread Messages', value: stats.unreadContactMessages, to: '/admin/contacts' },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Dashboard
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Overview of your restaurant&apos;s performance.
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md hover:border-amber-200 transition-all active:border-amber-300 touch-manipulation"
          >
            <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">{card.label}</p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mt-2 sm:mt-3">{card.value}</p>
            <p className="text-amber-500 text-[10px] sm:text-xs mt-2 sm:mt-3 font-medium tracking-wider">
              VIEW ALL &rarr;
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            Revenue Per Month
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByMonth} margin={{ top: 5, right: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatPrice(value)} />
              <Bar dataKey="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            Orders (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ordersByDay} margin={{ top: 5, right: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Orders"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            Reservation Status
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={reservationStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {reservationStats.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            Best Selling Meals
          </h2>
          {(data?.bestSellingMeals || []).length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No sales data yet.</p>
          ) : (
            <div className="space-y-4">
              {(data?.bestSellingMeals || []).map((meal, index) => (
                <div key={meal.menuItemId} className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {meal.productName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {meal.quantitySold} sold &middot; {formatPrice(meal.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
