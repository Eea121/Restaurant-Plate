import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyReservations, cancelReservation } from '../services/restaurantService';
import { getErrorMessage } from '../services/api';
import { formatDayDate, formatTimeSlot } from '../utils/formatters';
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_STYLES,
} from '../services/adminService';

const CANCELLABLE_STATUSES = ['Pending', 'Approved'];

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyReservations();
      setReservations(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id) => {
    setCancellingId(id);
    setError('');
    try {
      await cancelReservation(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

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
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide drop-shadow-md">My Reservations</h1>
          <p className="text-amber-500 text-xs tracking-[0.3em] mt-4 font-medium">YOUR RESERVATION HISTORY</p>
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
        ) : reservations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">You have no reservations yet.</p>
            <Link
              to="/reservation"
              className="inline-block mt-6 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-sm font-medium tracking-wider transition-colors"
            >
              BOOK A TABLE
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation) => {
              const canCancel = CANCELLABLE_STATUSES.includes(reservation.status);
              const isCancelling = cancellingId === reservation.id;
              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Reservation</p>
                      <p className="text-gray-900 font-mono text-sm mt-1">
                        #{String(reservation.id).slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Branch</p>
                      <p className="text-gray-900 text-sm mt-1">{reservation.branchLocation}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Date</p>
                      <p className="text-gray-900 text-sm mt-1">{formatDayDate(reservation.dayDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Time</p>
                      <p className="text-gray-900 text-sm mt-1">{formatTimeSlot(reservation.daySlotTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Guests</p>
                      <p className="text-gray-900 text-sm mt-1">{reservation.numberOfPeople}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${RESERVATION_STATUS_STYLES[reservation.status] || 'bg-gray-100 text-gray-600'}`}>
                        {RESERVATION_STATUS_LABELS[reservation.status] || reservation.status}
                      </span>
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={isCancelling}
                        className="w-full sm:w-auto sm:ml-auto justify-center border border-red-300 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold tracking-wider px-4 py-3 sm:py-2 rounded-sm transition-colors disabled:opacity-50 touch-manipulation"
                      >
                        {isCancelling ? 'CANCELLING...' : 'CANCEL RESERVATION'}
                      </button>
                    )}
                  </div>

                  <div className="border-t border-gray-100 px-6 py-4 flex flex-wrap gap-x-10 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Name</span>
                      <p className="text-gray-800 mt-0.5">
                        {reservation.firstName} {reservation.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Phone</span>
                      <p className="text-gray-800 mt-0.5">{reservation.phoneNumber}</p>
                    </div>
                    {reservation.email && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wider">Email</span>
                        <p className="text-gray-800 mt-0.5">{reservation.email}</p>
                      </div>
                    )}
                    {reservation.note && reservation.note !== 'No Added' && (
                      <div className="basis-full">
                        <span className="text-gray-400 text-xs uppercase tracking-wider">Note</span>
                        <p className="text-gray-800 mt-0.5">{reservation.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyReservations;
