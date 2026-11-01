import React from 'react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  acknowledged: { label: 'Acknowledged', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  assigned: { label: 'Assigned', classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolved: { label: 'Resolved', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejected', classes: 'bg-slate-600/20 text-slate-400 border-slate-500/30' },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', classes: 'bg-slate-700/50 text-slate-400 border-slate-600' },
  medium: { label: 'Medium', classes: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  high: { label: 'High', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  emergency: { label: '🚨 Emergency', classes: 'bg-red-600/15 text-red-400 border-red-500/30' },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
