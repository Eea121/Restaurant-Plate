import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import config from '../config';
import { getToken } from '../services/api';
import { useAuth } from './AuthContext';
import { formatPrice } from '../utils/formatters';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

const hubUrl = config.apiUrl.replace(/\/api\/?$/, '/hubs/notifications');

let idCounter = 0;

const buildNotification = (type, payload) => {
  const data = payload || {};
  idCounter += 1;
  let message = 'New update received';
  if (type === 'OrderCreated') {
    message = `New order from ${data.buyerEmail || 'a customer'} - ${formatPrice(
      data.total ?? data.subTotal ?? 0,
    )}`;
  } else if (type === 'ReservationCreated') {
    message = `New reservation from ${data.firstName || ''} ${data.lastName || ''}${
      data.numberOfPeople ? ` for ${data.numberOfPeople}` : ''
    }`;
  } else if (type === 'OrderStatusChanged') {
    message = `Order ${String(data.id || '').slice(0, 8)} is now ${data.status || 'updated'}`;
  }
  return {
    id: `${Date.now()}-${idCounter}`,
    type,
    message,
    time: new Date(),
    read: false,
  };
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const { token, isAdmin } = useAuth();

  const pushNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
    setToasts((prev) => [...prev, notification]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notification.id));
    }, 6000);
  }, []);

  useEffect(() => {
    // Only Admins can connect: the backend hub is [Authorize(Roles = "Admin")].
    // Customer attempts would always fail negotiation with 401 noise.
    if (!token || !isAdmin) return undefined;

    let disposed = false;
    let connection = null;
    let retryTimer = null;
    let retryAttempt = 0;

    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      retryAttempt += 1;
      // Exponential backoff capped at 30s - keeps trying forever until the
      // page closes or the effect re-runs (logout / role change).
      const delay = Math.min(1000 * 2 ** Math.min(retryAttempt, 5), 30000);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        startConnection();
      }, delay);
    };

    async function startConnection() {
      try {
        const { HubConnectionBuilder } = await import('@microsoft/signalr');
        if (disposed) return;

        if (!connection) {
          connection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
              accessTokenFactory: () => getToken() || token,
              // We authenticate with Bearer tokens, not cookies. SignalR sends
              // credentials by default which makes browsers reject responses
              // carrying "Access-Control-Allow-Origin: *" - disable them.
              withCredentials: false,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .build();

          connection.on('OrderCreated', (payload) =>
            pushNotification(buildNotification('OrderCreated', payload)),
          );
          connection.on('ReservationCreated', (payload) =>
            pushNotification(buildNotification('ReservationCreated', payload)),
          );
          connection.on('OrderStatusChanged', (payload) =>
            pushNotification(buildNotification('OrderStatusChanged', payload)),
          );
          connection.onreconnecting((err) => {
            console.warn('[SignalR] Reconnecting:', err?.message);
          });
          // withAutomaticReconnect gives up after its final delay; from here on
          // we take over so the connection always recovers eventually.
          connection.onclose((err) => {
            if (err) console.warn('[SignalR] Closed:', err.message);
            scheduleRetry();
          });
        }

        if (connection.state === 'Disconnected') {
          await connection.start();
          retryAttempt = 0;
        }
      } catch (err) {
        console.warn('[SignalR] Start failed:', err?.message || err);
        scheduleRetry();
      }
    }

    startConnection();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (connection) connection.stop().catch(() => {});
    };
  }, [token, isAdmin, pushNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        clearNotifications,
      }}
    >
      {children}

      <div className="fixed bottom-5 right-5 z-[100] space-y-3 w-80 max-w-[calc(100vw-2.5rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex items-start gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                {toast.type.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-sm mt-0.5">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
