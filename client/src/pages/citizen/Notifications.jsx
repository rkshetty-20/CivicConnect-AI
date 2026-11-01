import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import API from '../../services/api';
import { Bell, Loader2, CheckCheck, AlertCircle, CheckCircle2, ThumbsUp, MessageSquare, ShieldAlert } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  status_update: <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />,
  issue_resolved: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
  new_vote: <ThumbsUp className="w-5 h-5 text-teal-400 flex-shrink-0" />,
  new_comment: <MessageSquare className="w-5 h-5 text-sky-400 flex-shrink-0" />,
  new_issue: <Bell className="w-5 h-5 text-violet-400 flex-shrink-0" />,
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setUnreadCount } = useSocket() || {};

  const fetchAndMarkRead = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications);
      // Mark all as read
      await API.patch('/notifications/read');
      setUnreadCount?.(0);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndMarkRead();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Notifications</h1>
            <p className="text-slate-400 text-sm">Your alerts, updates, and issue activity.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Bell className="w-6 h-6 text-teal-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-3xl">
            <CheckCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">You're all caught up!</p>
            <p className="text-slate-600 text-sm mt-1">No new notifications at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 rounded-2xl border flex items-start space-x-4 transition ${
                  notif.isRead
                    ? 'bg-slate-900/40 border-slate-800/60'
                    : 'bg-teal-500/5 border-teal-500/15'
                }`}
              >
                <div className="mt-0.5">
                  {TYPE_ICONS[notif.type] || <Bell className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-600">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {notif.issue?._id && (
                      <Link
                        to={`/issues/${notif.issue._id}`}
                        className="text-xs text-teal-500 hover:text-teal-400 font-semibold transition"
                      >
                        View Issue →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;
