import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { formatPrice, formatDayDate } from '../utils/formatters';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from '../services/adminService';

const paymentStatus = (status) => {
  if (status === 'PaymentFailed') return { label: 'Payment Failed', style: 'bg-red-100 text-red-600' };
  if (status === 'Pending') return { label: 'Pending', style: 'bg-gray-100 text-gray-600' };
  return { label: 'Paid', style: 'bg-green-100 text-green-700' };
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div dir="ltr" className="w-full bg-gray-50 min-h-screen pb-20">
      <div
        className="relative text-white py-20 text-center bg-cover bg-center bg-no-repeat border-b border-amber-500/20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')",
        }}
      >
        <div className="relative z-10">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide drop-shadow-md">My Orders</h1>
          <p className="text-amber-500 text-xs tracking-[0.3em] mt-4 font-medium">YOUR ORDER HISTORY</p>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex flex-wrap gap-6">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="skeleton h-3 w-16" />
                      <div className="skeleton h-4 w-24" />
                    </div>
                  ))}
                </div>
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">You have no orders yet.</p>
            <Link
              to="/menu"
              className="inline-block mt-6 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-sm font-medium tracking-wider transition-colors"
            >
              BROWSE THE MENU
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const pay = paymentStatus(order.status);
              const isExpanded = expandedId === order.id;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full text-left px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Order Number</p>
                      <p className="text-gray-900 font-mono text-sm mt-1">
                        #{String(order.id).slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Date</p>
                      <p className="text-gray-900 text-sm mt-1">{formatDayDate(order.orderDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Items</p>
                      <p className="text-gray-900 text-sm mt-1">
                        {order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0} item(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Total</p>
                      <p className="text-amber-500 font-bold text-sm mt-1">{formatPrice(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Payment</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${pay.style}`}>
                        {pay.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <span className="ml-auto text-amber-600 text-xs font-medium tracking-wider">
                      {isExpanded ? 'HIDE DETAILS' : 'VIEW DETAILS'} &rarr;
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-6 py-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Items</h3>
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 px-4 py-3">
                              {item.pictureUrl ? (
                                <img
                                  src={item.pictureUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                  No img
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                                <p className="text-xs text-gray-400">
                                  {item.quantity} &times; {formatPrice(item.price)}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-800">
                                {formatPrice((item.price || 0) * (item.quantity || 0))}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Address</h3>
                          {order.shipToAddress ? (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {order.shipToAddress.firstName} {order.shipToAddress.lastName}
                              <br />
                              {order.shipToAddress.street}
                              <br />
                              {order.shipToAddress.city}, {order.shipToAddress.country}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400">No address provided.</p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Method</h3>
                          <p className="text-sm text-gray-600">{order.deliveryMethod || 'Standard'}</p>
                          <h3 className="text-sm font-semibold text-gray-900 mt-5 mb-3">Payment</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pay.style}`}>
                            {pay.label}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Delivery</span>
                          <span>{formatPrice(order.deliveryCost)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-bold text-base pt-1">
                          <span>Total</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyOrders;
