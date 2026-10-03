import { useEffect, useState, useRef } from 'react';
import * as notificationService from '../services/notificationService';
import { useRealtime } from '../context/RealtimeContext';
import { timeAgo } from '../utils/format';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { subscribe } = useRealtime();
  const ref = useRef(null);

  async function load() {
    try {
      const data = await notificationService.listNotifications();
      setNotifications(data.notifications);
    } catch {
      // silent - notification bell shouldn't break the page
    }
  }

  useEffect(() => {
    load();
    const unsub = subscribe('NOTIFICATION', (payload) => setNotifications((prev) => [payload, ...prev]));
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkAll() {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        className="relative rounded-full p-2 text-text-secondary hover:bg-surface hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-surface bg-white shadow-essential">
          <div className="flex items-center justify-between border-b border-surface px-4 py-3">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs font-medium text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-tertiary">No notifications yet.</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div key={n.id} className={`border-b border-surface px-4 py-3 text-sm ${!n.is_read ? 'bg-primary-50/50' : ''}`}>
                  <p className="font-medium text-text-primary">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-text-secondary">{n.body}</p>}
                  <p className="mt-1 text-xs text-text-tertiary">{timeAgo(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
