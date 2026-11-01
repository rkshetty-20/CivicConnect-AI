import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import IssueForm from '../../components/issues/IssueForm';
import { createIssue } from '../../services/issueService';
import { SeverityBadge } from '../../components/issues/StatusBadge';
import { CheckCircle2, ArrowLeft, AlertTriangle, Zap, Copy } from 'lucide-react';

function ReportIssue() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(null); // store returned issue

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const issue = await createIssue(formData);
      setSubmitted(issue);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-teal-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Report Submitted!</h1>
          <p className="text-slate-400 mb-2">
            Your issue has been filed and classified by our AI system.
          </p>
          <div className="my-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Category</span>
              <span className="text-teal-400 font-semibold">{submitted.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Severity</span>
              <SeverityBadge severity={submitted.severity} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="text-slate-300 font-semibold capitalize">{submitted.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority Score</span>
              <span className="text-teal-400 font-semibold">{Math.round(submitted.priorityScore) || 0}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AI Confidence</span>
              <span className="text-slate-300">{((submitted.aiConfidence || 0) * 100).toFixed(0)}%</span>
            </div>
            {submitted.recommendedDepartment && (
              <div className="flex justify-between">
                <span className="text-slate-500">Recommended Dept.</span>
                <span className="text-slate-300 font-semibold">{submitted.recommendedDepartment}</span>
              </div>
            )}
          </div>

          {submitted.summary && (
            <div className="mb-6 p-4 rounded-xl bg-teal-500/5 border border-teal-500/15 text-left text-sm">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> AI Analysis
              </h3>
              <p className="text-slate-300 leading-relaxed">{submitted.summary}</p>
              {submitted.safetyRisk && (
                <p className="text-orange-300 leading-relaxed mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {submitted.safetyRisk}
                </p>
              )}
            </div>
          )}

          {Array.isArray(submitted.duplicateCandidates) && submitted.duplicateCandidates.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left text-sm">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Similar issues already reported nearby
              </h3>
              <p className="text-slate-400 text-xs mb-3">You can upvote an existing report to raise its priority instead of filing a duplicate.</p>
              <div className="space-y-2">
                {submitted.duplicateCandidates.map((d) => (
                  <button
                    key={d._id}
                    onClick={() => navigate(`/issues/${d._id}`)}
                    className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition"
                  >
                    <span className="min-w-0">
                      <span className="block text-slate-200 font-medium truncate">{d.title}</span>
                      <span className="block text-xs text-slate-500">{d.category} • {d.votesCount} votes</span>
                    </span>
                    <SeverityBadge severity={d.severity} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/issues/${submitted._id}`)}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl transition"
            >
              View My Report
            </button>
            <button
              onClick={() => { setSubmitted(null); setError(null); }}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-300 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Report a Civic Issue</h1>
          <p className="text-slate-400">
            Fill in the details below. Our AI will auto-classify your issue and route it to the right department.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <IssueForm onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
