import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import API from '../../services/api';
import {
  Loader2, Plus, Users, ShieldAlert, BarChart3, Building2, Trash2, ShieldCheck, Mail, Phone,
  AlertTriangle, CheckCircle2, ListChecks, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { StatusBadge, SeverityBadge } from '../../components/issues/StatusBadge';

const CATEGORIES = [
  'Garbage', 'Roads', 'Water', 'Electricity', 'Sewage',
  'Streetlights', 'Parks', 'Public Transport', 'Building Safety',
  'Noise Pollution', 'Other',
];

const SEVERITY_COLORS = { low: '#38bdf8', medium: '#fbbf24', high: '#fb923c', emergency: '#f43f5e' };
const STATUS_COLORS = {
  pending: '#f43f5e', acknowledged: '#3b82f6', assigned: '#6366f1',
  in_progress: '#f59e0b', resolved: '#10b981', rejected: '#64748b',
};
const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px',
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | complaints | departments | officers | fake-reports
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [fakeReports, setFakeReports] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [deptName, setDeptName] = useState('');
  const [deptEmail, setDeptEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPhone, setOfficerPhone] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerDeptId, setOfficerDeptId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, deptRes, offRes, fakeRes, compRes] = await Promise.all([
        API.get('/analytics/summary'),
        API.get('/admin/departments'),
        API.get('/admin/officers'),
        API.get('/admin/fake-reports'),
        API.get('/issues?limit=200'),
      ]);
      setSummary(sumRes.data);
      setDepartments(deptRes.data);
      setOfficers(offRes.data);
      setFakeReports(fakeRes.data);
      setComplaints(compRes.data.issues || compRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/departments', {
        name: deptName,
        contactEmail: deptEmail,
        category: selectedCategories,
      });
      setDepartments((prev) => [...prev, res.data]);
      setDeptName('');
      setDeptEmail('');
      setSelectedCategories([]);
      alert('Department created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department.');
    }
  };

  const handleRegisterOfficer = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/officers', {
        name: officerName,
        email: officerEmail,
        phone: officerPhone,
        password: officerPassword,
        departmentId: officerDeptId,
      });
      setOfficers((prev) => [res.data, ...prev]);
      setOfficerName('');
      setOfficerEmail('');
      setOfficerPhone('');
      setOfficerPassword('');
      setOfficerDeptId('');
      alert('Officer account registered successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register officer.');
    }
  };

  const handleFakeAction = async (issueId, action) => {
    try {
      await API.patch(`/admin/fake-reports/${issueId}/resolve`, { action });
      setFakeReports((prev) => prev.filter((item) => item._id !== issueId));
      alert(`Flagged report resolved with action: ${action}`);
    } catch (err) {
      alert('Failed to resolve flagged report.');
    }
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Admin can advance lifecycle status and reassign departments globally.
  const nextStatusFor = (status) => {
    switch (status) {
      case 'pending': return 'acknowledged';
      case 'acknowledged': return 'assigned';
      case 'assigned': return 'in_progress';
      case 'in_progress': return 'resolved';
      default: return null;
    }
  };

  const handleAdvanceStatus = async (issue) => {
    const next = nextStatusFor(issue.status);
    if (!next) return;
    setActionLoading(issue._id);
    try {
      const payload = { status: next, remarks: 'Administrative review update.' };
      if (next === 'assigned') payload.departmentId = issue.department?._id || departments[0]?._id;
      if (next === 'resolved') payload.resolutionNotes = 'Marked resolved by administrator.';
      const res = await API.patch(`/issues/${issue._id}/status`, payload);
      setComplaints((prev) => prev.map((c) => (c._id === res.data._id ? { ...c, ...res.data } : c)));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update complaint.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReassignDept = async (issueId, departmentId) => {
    setActionLoading(issueId);
    try {
      const res = await API.patch(`/issues/${issueId}/status`, { departmentId, remarks: 'Reassigned by administrator.' });
      setComplaints((prev) => prev.map((c) => (c._id === res.data._id ? { ...c, ...res.data } : c)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reassign department.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredComplaints = complaintFilter === 'all'
    ? complaints
    : complaints.filter((c) => c.status === complaintFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Administrative Center</h1>
            <p className="text-slate-400 text-sm">System configuration, officer mapping and global analytics.</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition"
          >
            Refresh System Data
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-850 mb-8 overflow-x-auto space-x-1.5 pb-px">
          {[
            { id: 'analytics', label: 'Overview Metrics', Icon: BarChart3 },
            { id: 'complaints', label: 'All Complaints', Icon: ListChecks },
            { id: 'departments', label: 'Departments', Icon: Building2 },
            { id: 'officers', label: 'Officers Directory', Icon: Users },
            { id: 'fake-reports', label: 'Fake Flag Audit', Icon: ShieldAlert },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition duration-200 ${
                activeTab === id
                  ? 'border-teal-500 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          </div>
        ) : (
          <div>
            {/* Overview / Analytics tab */}
            {activeTab === 'analytics' && summary && (
              <div className="space-y-8">
                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Complaints', value: summary.summary.totalIssues, color: 'text-slate-200' },
                    { label: 'Critical / Emergency', value: summary.summary.criticalIssues, color: 'text-rose-400' },
                    { label: 'Resolution Rate', value: `${summary.summary.overallResolutionRate.toFixed(0)}%`, color: 'text-emerald-400' },
                    { label: 'Active Departments', value: summary.summary.totalDepartments, color: 'text-teal-400' },
                    { label: 'Awaiting Action', value: summary.summary.pendingIssues, color: 'text-rose-400' },
                    { label: 'In Progress', value: summary.summary.progressIssues, color: 'text-amber-400' },
                    { label: 'Officers Active', value: summary.summary.totalOfficers, color: 'text-slate-200' },
                    { label: 'Registered Citizens', value: summary.summary.totalCitizens, color: 'text-slate-200' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                      <p className={`text-2xl md:text-3xl font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts row: severity + status distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-base font-bold text-slate-200 mb-4">Complaints by Severity</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary.severityDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="severity" stroke="#64748b" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#1e293b55' }} />
                          <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]}>
                            {summary.severityDistribution.map((entry) => (
                              <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-base font-bold text-slate-200 mb-4">Lifecycle Status</h3>
                    <div className="h-56 flex items-center">
                      <ResponsiveContainer width="50%" height="100%">
                        <PieChart>
                          <Pie data={summary.statusDistribution.filter((s) => s.count > 0)} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                            {summary.statusDistribution.filter((s) => s.count > 0).map((entry) => (
                              <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 flex-1">
                        {summary.statusDistribution.map((s) => (
                          <div key={s.status} className="flex items-center justify-between text-xs">
                            <span className="flex items-center space-x-2 text-slate-400">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                              <span className="capitalize">{s.status.replace('_', ' ')}</span>
                            </span>
                            <span className="font-bold text-slate-200">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly trend */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-slate-200 mb-4">Reporting vs Resolution Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summary.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="total" name="Reported" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorTotal)" />
                        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top voted + department performance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-base font-bold text-slate-200 mb-4">Most Voted</h3>
                    <div className="space-y-3">
                      {summary.topVoted.map((issue) => (
                        <div key={issue._id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-slate-300 font-medium truncate">{issue.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">{issue.category}</span>
                              <SeverityBadge severity={issue.severity} />
                            </div>
                          </div>
                          <span className="text-sm font-black text-teal-400 flex-shrink-0">▲ {issue.votesCount}</span>
                        </div>
                      ))}
                      {summary.topVoted.length === 0 && <p className="text-sm text-slate-500">No complaints yet.</p>}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-base font-bold text-slate-200 mb-4">Department Performance Metrics</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="pb-3">Department</th>
                            <th className="pb-3">Total Assigned</th>
                            <th className="pb-3">Resolved</th>
                            <th className="pb-3">Resolution Efficiency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {summary.departments.map((dept) => (
                            <tr key={dept._id || 'unassigned'} className="hover:bg-slate-800/20 transition">
                              <td className="py-3 font-semibold text-slate-300">{dept.departmentName}</td>
                              <td className="py-3 text-slate-400">{dept.total}</td>
                              <td className="py-3 text-slate-400">{dept.resolved}</td>
                              <td className="py-3 font-semibold text-teal-400">{dept.resolutionRate.toFixed(0)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Complaints management tab */}
            {activeTab === 'complaints' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-200">All Complaints ({filteredComplaints.length})</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['all', 'pending', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => (
                      <button key={s} onClick={() => setComplaintFilter(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${complaintFilter === s ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                        {s === 'all' ? 'All' : s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="p-3">Complaint</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Department</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredComplaints.map((issue) => {
                        const next = nextStatusFor(issue.status);
                        const busy = actionLoading === issue._id;
                        return (
                          <tr key={issue._id} className="hover:bg-slate-800/30 transition">
                            <td className="p-3">
                              <div className="font-semibold text-slate-200 max-w-[240px] truncate">{issue.title}</div>
                              <div className="text-xs text-slate-500">{issue.category}</div>
                            </td>
                            <td className="p-3"><SeverityBadge severity={issue.severity} /></td>
                            <td className="p-3"><StatusBadge status={issue.status} /></td>
                            <td className="p-3 font-semibold text-teal-400">{Math.round(issue.priorityScore) || 0}/100</td>
                            <td className="p-3">
                              <select value={issue.department?._id || ''} onChange={(e) => handleReassignDept(issue._id, e.target.value)} disabled={busy}
                                className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 max-w-[160px]">
                                <option value="">Unassigned</option>
                                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              {next && (
                                <button onClick={() => handleAdvanceStatus(issue)} disabled={busy}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition disabled:opacity-50">
                                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                  <span className="capitalize">{next.replace('_', ' ')}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredComplaints.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No complaints match this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Manage Departments Tab */}
            {activeTab === 'departments' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 h-fit space-y-5">
                  <h3 className="text-base font-bold text-slate-200">Register Department</h3>
                  <form onSubmit={handleCreateDept} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Department Name</label>
                      <input
                        type="text"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                        placeholder="e.g. Sanitation Department"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Email</label>
                      <input
                        type="email"
                        value={deptEmail}
                        onChange={(e) => setDeptEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                        placeholder="e.g. sanitation@citygov.in"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Assigned Categories</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-800 p-2.5 rounded-xl bg-slate-950">
                        {CATEGORIES.map((cat) => (
                          <label key={cat} className="flex items-center space-x-2 text-xs text-slate-450 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat)}
                              onChange={() => handleCategoryToggle(cat)}
                              className="rounded border-slate-800 text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                            />
                            <span>{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-1 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Department</span>
                    </button>
                  </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-slate-200 mb-4">Department Registry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((dept) => (
                      <div key={dept._id} className="p-4 border border-slate-800 rounded-2xl bg-slate-950/40">
                        <h4 className="font-bold text-slate-200">{dept.name}</h4>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{dept.contactEmail}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {dept.category.map((cat) => (
                            <span key={cat} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Manage Officers Tab */}
            {activeTab === 'officers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 h-fit space-y-5">
                  <h3 className="text-base font-bold text-slate-200">Register Department Officer</h3>
                  <form onSubmit={handleRegisterOfficer} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Officer Name</label>
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                        placeholder="Officer Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={officerEmail}
                        onChange={(e) => setOfficerEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                        placeholder="officer@citygov.in"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={officerPhone}
                        onChange={(e) => setOfficerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                        placeholder="+91..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
                      <input
                        type="password"
                        value={officerPassword}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Assigned Department</label>
                      <select
                        value={officerDeptId}
                        onChange={(e) => setOfficerDeptId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm appearance-none"
                        required
                      >
                        <option value="">Choose department...</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-1 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Officer Account</span>
                    </button>
                  </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-slate-200 mb-4">Officer Roster</h3>
                  <div className="space-y-3">
                    {officers.map((officer) => (
                      <div key={officer._id} className="p-4 border border-slate-800 rounded-2xl bg-slate-950/40 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-200">{officer.name}</h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[10px] font-semibold border border-teal-500/15">
                            {officer.department?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="text-right text-xs text-slate-500 space-y-0.5">
                          <div className="flex items-center justify-end space-x-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{officer.email}</span>
                          </div>
                          <div className="flex items-center justify-end space-x-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{officer.phone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Flagged Fake Reports Tab */}
            {activeTab === 'fake-reports' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-base font-bold text-slate-250 mb-4">Audited Fake Complaints list</h3>
                {fakeReports.length === 0 ? (
                  <div className="text-center py-12 text-slate-550">
                    No flagged reports require audit review.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fakeReports.map((report) => (
                      <div key={report._id} className="p-5 border border-slate-800 rounded-2xl bg-slate-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-slate-200">{report.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-xl">{report.description}</p>
                          <div className="flex items-center space-x-3 text-slate-600 text-xs mt-3">
                            <span>Reporter: {report.reportedBy?.name}</span>
                            <span>•</span>
                            <span>Category: {report.category}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <button
                            onClick={() => handleFakeAction(report._id, 'dismiss')}
                            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-600 hover:text-slate-900 rounded-xl text-xs transition"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Clear Flag</span>
                          </button>
                          <button
                            onClick={() => handleFakeAction(report._id, 'delete')}
                            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove Issue</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
