import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { StatusBadge, SeverityBadge } from '../../components/issues/StatusBadge';
import API from '../../services/api';
import { Loader2, CheckCircle2, Play, AlertCircle, Eye, Bell, Users, XCircle, Gauge, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Text-required actions open a modal (reason/notes are enforced by the backend).
const MODAL_ACTIONS = {
  reject: { title: 'Reject Complaint', cta: 'Reject', tone: 'bg-rose-600 hover:bg-rose-700' },
  resolve: { title: 'Resolve Complaint', cta: 'Confirm Resolve', tone: 'bg-emerald-500 hover:bg-emerald-600' },
  priority: { title: 'Adjust Priority Score', cta: 'Update Priority', tone: 'bg-teal-500 hover:bg-teal-600' },
};

function OfficerDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [modal, setModal] = useState(null); // { issue, kind }
  const [form, setForm] = useState({ remarks: '', resolutionNotes: '', priorityScore: 50, priorityReason: '' });
  const [modalError, setModalError] = useState('');

  const fetchAssigned = async () => {
    try {
      const res = await API.get('/officer/assigned');
      setIssues(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const applyUpdate = (updated) => {
    setIssues((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
  };

  // Quick transitions that need no extra input. `assigned` reuses the officer's own department.
  const handleQuickStatus = async (issue, nextStatus) => {
    setActionLoading(issue._id);
    try {
      const payload = { status: nextStatus };
      if (nextStatus === 'assigned') payload.departmentId = issue.department?._id;
      const res = await API.patch(`/issues/${issue._id}/status`, payload);
      applyUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update issue status.');
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (issue, kind) => {
    setModalError('');
    setForm({
      remarks: '',
      resolutionNotes: '',
      priorityScore: Math.round(issue.priorityScore) || 50,
      priorityReason: '',
    });
    setModal({ issue, kind });
  };

  const submitModal = async () => {
    if (!modal) return;
    const { issue, kind } = modal;
    setActionLoading(issue._id);
    setModalError('');
    try {
      let payload = {};
      if (kind === 'reject') {
        if (!form.remarks.trim()) { setModalError('A reason is required to reject.'); setActionLoading(null); return; }
        payload = { status: 'rejected', remarks: form.remarks.trim() };
      } else if (kind === 'resolve') {
        if (!form.resolutionNotes.trim()) { setModalError('Resolution notes are required.'); setActionLoading(null); return; }
        payload = { status: 'resolved', resolutionNotes: form.resolutionNotes.trim(), remarks: form.remarks.trim() || 'Work completed.' };
      } else if (kind === 'priority') {
        if (!form.priorityReason.trim()) { setModalError('A reason is required to change priority.'); setActionLoading(null); return; }
        payload = { priorityScore: Number(form.priorityScore), priorityReason: form.priorityReason.trim() };
      }
      const res = await API.patch(`/issues/${issue._id}/status`, payload);
      applyUpdate(res.data);
      setModal(null);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update issue.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (issue) => {
    const busy = actionLoading === issue._id;
    const btn = 'flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50';
    const nodes = [];

    if (issue.status === 'pending') {
      nodes.push(
        <button key="ack" onClick={() => handleQuickStatus(issue, 'acknowledged')} disabled={busy}
          className={`${btn} bg-blue-500 hover:bg-blue-600 text-slate-950`}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
          <span>Acknowledge</span>
        </button>
      );
    }
    if (issue.status === 'acknowledged') {
      nodes.push(
        <button key="assign" onClick={() => handleQuickStatus(issue, 'assigned')} disabled={busy || !issue.department}
          className={`${btn} bg-indigo-500 hover:bg-indigo-600 text-slate-950`}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
          <span>Assign</span>
        </button>
      );
    }
    if (issue.status === 'assigned') {
      nodes.push(
        <button key="start" onClick={() => handleQuickStatus(issue, 'in_progress')} disabled={busy}
          className={`${btn} bg-amber-500 hover:bg-amber-600 text-slate-950`}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          <span>Start Work</span>
        </button>
      );
    }
    if (issue.status === 'in_progress') {
      nodes.push(
        <button key="resolve" onClick={() => openModal(issue, 'resolve')} disabled={busy}
          className={`${btn} bg-emerald-500 hover:bg-emerald-600 text-slate-950`}>
          <CheckCircle2 className="w-3.5 h-3.5" /><span>Resolve</span>
        </button>
      );
    }
    if (!['resolved', 'rejected'].includes(issue.status)) {
      nodes.push(
        <button key="pri" onClick={() => openModal(issue, 'priority')} disabled={busy}
          className={`${btn} bg-slate-700 hover:bg-slate-600 text-slate-100`}>
          <Gauge className="w-3.5 h-3.5" /><span>Priority</span>
        </button>,
        <button key="rej" onClick={() => openModal(issue, 'reject')} disabled={busy}
          className={`${btn} bg-rose-600/90 hover:bg-rose-700 text-white`}>
          <XCircle className="w-3.5 h-3.5" /><span>Reject</span>
        </button>
      );
    }
    return nodes;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Officer Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Manage and resolve complaints assigned to your department.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 border border-slate-800 rounded-3xl">
            <p className="text-slate-500 text-lg font-bold">No issues assigned</p>
            <p className="text-slate-500 text-sm mt-1">All complaints are currently resolved or review pending.</p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Complaint Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {issues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-slate-800/40 transition align-middle">
                      <td className="p-4 font-semibold text-slate-200 max-w-[280px]">
                        <div className="truncate">{issue.title}</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5 truncate">{issue.address}</div>
                      </td>
                      <td className="p-4 text-slate-400">{issue.category}</td>
                      <td className="p-4"><SeverityBadge severity={issue.severity} /></td>
                      <td className="p-4"><StatusBadge status={issue.status} /></td>
                      <td className="p-4 font-semibold text-teal-400">{Math.round(issue.priorityScore) || 0}/100</td>
                      <td className="p-4">
                        <div className="flex justify-end items-center gap-2 flex-wrap">
                          <Link
                            to={`/issues/${issue._id}`}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {renderActions(issue)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4" onClick={() => setModal(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{MODAL_ACTIONS[modal.kind].title}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4 truncate">{modal.issue.title}</p>

            {modal.kind === 'reject' && (
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason (mandatory)</span>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3}
                  className="mt-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                  placeholder="Why is this complaint being rejected?" />
              </label>
            )}

            {modal.kind === 'resolve' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolution Notes (mandatory)</span>
                  <textarea value={form.resolutionNotes} onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })} rows={3}
                    className="mt-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Describe the work completed." />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Remarks (optional)</span>
                  <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="mt-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                </label>
              </div>
            )}

            {modal.kind === 'priority' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority Score: {form.priorityScore}/100</span>
                  <input type="range" min="0" max="100" value={form.priorityScore} onChange={(e) => setForm({ ...form, priorityScore: e.target.value })}
                    className="mt-2 w-full accent-teal-500" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason (mandatory)</span>
                  <textarea value={form.priorityReason} onChange={(e) => setForm({ ...form, priorityReason: e.target.value })} rows={2}
                    className="mt-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500"
                    placeholder="Justify the priority change for the audit trail." />
                </label>
              </div>
            )}

            {modalError && (
              <p className="text-sm text-rose-400 mt-3 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" /><span>{modalError}</span>
              </p>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold">Cancel</button>
              <button onClick={submitModal} disabled={actionLoading === modal.issue._id}
                className={`px-4 py-2 rounded-xl text-slate-950 text-sm font-bold transition disabled:opacity-50 ${MODAL_ACTIONS[modal.kind].tone}`}>
                {actionLoading === modal.issue._id ? <Loader2 className="w-4 h-4 animate-spin" /> : MODAL_ACTIONS[modal.kind].cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficerDashboard;
