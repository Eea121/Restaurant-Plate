import { useCallback, useEffect, useState } from 'react';
import {
  getAdminOrders,
  updateOrderStatus,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatPrice, formatDayDate } from '../../utils/formatters';

const PAGE_SIZE = 10;

// Keeps the input responsive while only firing one request after typing stops,
// preventing a burst of overlapping requests from racing each other.
const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:border-amber-500 text-sm';

const detailsBtnClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1';

const AdminOrders = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [details, setDetails] = useState(null);

  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      try {
        const params = {
          search: debouncedSearch.trim() || undefined,
          status: status !== '' ? Number(status) : undefined,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
          pageIndex,
          pageSize: PAGE_SIZE,
        };
        // Abort the previous request whenever filters change so a slow, stale
        // response can never overwrite a newer one (out-of-order race).
        const res = await getAdminOrders(params, { signal });
        setRows(res.data.data || []);
        setTotalCount(res.data.count || 0);
      } catch (err) {
        // Aborted requests must not touch state - a newer request owns the UI.
        if (
          signal?.aborted ||
          err?.code === 'ERR_CANCELED' ||
          err?.name === 'CanceledError'
        )
          return;
        setError(getErrorMessage(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debouncedSearch, status, from, to, pageIndex],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleStatusChange = async (order, newStatus) => {
    setUpdatingId(order.id);
    setError('');
    try {
      const res = await updateOrderStatus(order.id, Number(newStatus));
      const updated = res.data;
      setRows((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: updated.status } : o,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([name, label]) => [
    ORDER_STATUS[name],
    label,
  ]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Orders
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Manage and update the status of customer orders.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(1);
            }}
            className={`${inputClass} w-full sm:max-w-xs`}
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPageIndex(1);
            }}
            className={`${inputClass} w-full sm:w-[180px]`}
          >
            <option value="">All Statuses</option>
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPageIndex(1);
              }}
              className={`${inputClass} w-full sm:max-w-[160px]`}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPageIndex(1);
              }}
              className={`${inputClass} w-full sm:max-w-[160px]`}
            />
          </div>
        </div>

        {/* Desktop table (≥768px) — unchanged */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center text-gray-500 text-sm tracking-widest">
                    LOADING...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center text-gray-500 text-sm">
                    No orders found.
                  </td>
                </tr>
              ) : (
                rows.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {String(order.id).slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{order.buyerEmail}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {formatDayDate(order.orderDate)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={ORDER_STATUS[order.status] ?? order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer transition-shadow focus:ring-2 focus:ring-amber-400 disabled:opacity-60 focus:outline-none ${ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {statusOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setDetails(order)}
                        className={detailsBtnClass}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards (<768px) */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-4 space-y-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-5 py-16 text-center text-gray-500 text-sm">No orders found.</p>
          ) : (
            rows.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-gray-500">
                      #{String(order.id).slice(0, 8)}
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 break-all">
                      {order.buyerEmail}
                    </p>
                  </div>
                  <p className="text-amber-600 font-bold text-sm shrink-0">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs uppercase tracking-wider text-gray-400 shrink-0">Date</dt>
                    <dd className="text-gray-700 text-right">{formatDayDate(order.orderDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs uppercase tracking-wider text-gray-400 shrink-0">Items</dt>
                    <dd className="text-gray-700 text-right">
                      {order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs uppercase tracking-wider text-gray-400 shrink-0">Status</dt>
                    <dd>
                      <select
                        value={ORDER_STATUS[order.status] ?? order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer transition-shadow focus:ring-2 focus:ring-amber-400 disabled:opacity-60 focus:outline-none ${ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {statusOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>
                </dl>
                <div className="pt-3 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setDetails(order)} className={detailsBtnClass}>
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {rows.length} of {totalCount}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                PREV
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                {pageIndex} / {totalPages}
              </span>
<button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex === totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>

      {details && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-gray-900">
                Order Details
              </h2>
              <button
                onClick={() => setDetails(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Order</p>
                  <p className="text-gray-800 font-mono text-xs mt-1">{details.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Date</p>
                  <p className="text-gray-800 mt-1">{formatDayDate(details.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Delivery</p>
                  <p className="text-gray-800 mt-1">{details.deliveryMethod}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Status</p>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_STYLES[details.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {ORDER_STATUS_LABELS[details.status] || details.status}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Items</h3>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {details.items?.map((item, index) => (
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
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.productName}
                        </p>
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

              {details.shipToAddress && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Shipping Address
                  </h3>
                  <p className="text-sm text-gray-600">
                    {details.shipToAddress.firstName} {details.shipToAddress.lastName}
                    <br />
                    {details.shipToAddress.street}
                    <br />
                    {details.shipToAddress.city}, {details.shipToAddress.country}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(details.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{formatPrice(details.deliveryCost)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{formatPrice(details.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
