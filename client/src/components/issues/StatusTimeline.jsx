import { CheckCircle2, Clock, Wrench, AlertCircle, Bell, Users, XCircle } from 'lucide-react';

// Canonical lifecycle stages used both for labels/icons and as a fallback
// when a complaint has no recorded statusHistory yet.
const STAGE_META = {
  pending: { label: 'Reported', icon: AlertCircle, color: 'text-rose-400', ring: 'border-rose-500/40 bg-rose-500/10' },
  acknowledged: { label: 'Acknowledged', icon: Bell, color: 'text-blue-400', ring: 'border-blue-500/40 bg-blue-500/10' },
  assigned: { label: 'Assigned', icon: Users, color: 'text-indigo-400', ring: 'border-indigo-500/40 bg-indigo-500/10' },
  in_progress: { label: 'In Progress', icon: Wrench, color: 'text-amber-400', ring: 'border-amber-500/40 bg-amber-500/10' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400', ring: 'border-emerald-500/40 bg-emerald-500/10' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-slate-400', ring: 'border-slate-500/40 bg-slate-500/10' },
};

const CANONICAL_PATH = ['pending', 'acknowledged', 'assigned', 'in_progress', 'resolved'];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusTimeline({ currentStatus, statusHistory }) {
  // Prefer the real audit trail; fall back to canonical stages up to current status.
  let events;
  if (Array.isArray(statusHistory) && statusHistory.length > 0) {
    events = statusHistory.map((h) => ({
      status: h.to,
      remarks: h.remarks,
      timestamp: h.timestamp,
      actorName: h.updatedBy?.name,
    }));
  } else {
    const idx = currentStatus === 'rejected'
      ? ['pending', 'rejected']
      : CANONICAL_PATH.slice(0, CANONICAL_PATH.indexOf(currentStatus) + 1 || 1);
    events = idx.map((s) => ({ status: s }));
  }

  return (
    <div className="relative py-1 pl-1">
      <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-slate-800 rounded-full" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const meta = STAGE_META[event.status] || STAGE_META.pending;
          const isCurrent = index === events.length - 1;
          const Icon = meta.icon;

          return (
            <div key={`${event.status}-${index}`} className="flex items-start gap-3 relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${meta.ring} ${meta.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="pt-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${isCurrent ? meta.color : 'text-slate-300'}`}>
                    {meta.label}
                  </span>
                  {event.timestamp && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.timestamp)}
                    </span>
                  )}
                </div>
                {event.remarks && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.remarks}</p>
                )}
                {event.actorName && (
                  <p className="text-[11px] text-slate-600 mt-0.5">by {event.actorName}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatusTimeline;
