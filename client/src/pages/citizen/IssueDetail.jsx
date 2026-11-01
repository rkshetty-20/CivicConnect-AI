import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Shield, AlertCircle, Loader2, Award, Zap, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import UpvoteButton from '../../components/issues/UpvoteButton';
import CommentSection from '../../components/issues/CommentSection';
import { StatusBadge, SeverityBadge } from '../../components/issues/StatusBadge';
import StatusTimeline from '../../components/issues/StatusTimeline';
import { getIssueById } from '../../services/issueService';
import { useSocket } from '../../context/SocketContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet marker setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useSocket() || {};

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getIssueById(id);
        setIssue(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load issue details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data) => {
      if (data._id === id) {
        setIssue((prev) => prev ? { ...prev, status: data.status } : prev);
      }
    };
    socket.on('issue:statusUpdated', handleStatusUpdate);
    return () => {
      socket.off('issue:statusUpdated', handleStatusUpdate);
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-slate-500 mt-4 text-sm">Loading issue file...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error Loading Issue</h1>
          <p className="text-slate-500 mb-6">{error || 'Issue files could not be retrieved.'}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-800 rounded-xl text-slate-200">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-sm text-slate-550 hover:text-slate-350 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        {/* Title row */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-3">
            {issue.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4" />
              <span>Reported {formattedDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>By {issue.reportedBy?.name || 'Anonymous'}</span>
            </span>
            {issue.address && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{issue.address}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery / Before & After */}
            {issue.status === 'resolved' && issue.resolutionPhoto ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Before (Reported by Community)</span>
                    <div className="rounded-3xl overflow-hidden border border-slate-800/80 aspect-[4/3] bg-slate-900">
                      <img src={issue.images[0]} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>After (Resolved by Department)</span>
                    </span>
                    <div className="rounded-3xl overflow-hidden border border-teal-500/20 aspect-[4/3] bg-slate-900">
                      <img src={issue.resolutionPhoto} alt="After" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              issue.images && issue.images.length > 0 && (
                <div className="rounded-3xl overflow-hidden border border-slate-800/80 max-h-[480px]">
                  <img
                    src={issue.images[0]}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            )}

            {/* Description */}
            <div className="p-6 bg-slate-900/40 border border-slate-900/60 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{issue.description}</p>
            </div>

            {/* AI Insights */}
            {(issue.summary || issue.safetyRisk || issue.suggestedAction || issue.recommendedDepartment) && (
              <div className="p-6 bg-teal-500/5 border border-teal-500/20 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>AI Analysis</span>
                </h3>
                {issue.summary && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{issue.summary}</p>
                  </div>
                )}
                {issue.safetyRisk && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Safety Risk</p>
                    <p className="text-sm text-orange-300 leading-relaxed flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{issue.safetyRisk}</span>
                    </p>
                  </div>
                )}
                {issue.suggestedAction && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Suggested Action</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{issue.suggestedAction}</p>
                  </div>
                )}
                {issue.recommendedDepartment && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommended Department</p>
                    <p className="text-slate-200 text-sm font-semibold">{issue.recommendedDepartment}</p>
                  </div>
                )}
              </div>
            )}

            {/* Resolution notes */}
            {issue.status === 'resolved' && issue.resolutionNotes && (
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolution Notes</span>
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{issue.resolutionNotes}</p>
              </div>
            )}

            {/* Similar / duplicate issues */}
            {Array.isArray(issue.duplicateCandidates) && issue.duplicateCandidates.length > 0 && (
              <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Possible Duplicates Nearby</span>
                </h3>
                <div className="space-y-2">
                  {issue.duplicateCandidates.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => navigate(`/issues/${d._id}`)}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition"
                    >
                      <span className="min-w-0">
                        <span className="block text-slate-200 font-medium truncate">{d.title}</span>
                        <span className="block text-xs text-slate-500">{d.category} • {d.votesCount} votes • {d.status?.replace('_', ' ')}</span>
                      </span>
                      <SeverityBadge severity={d.severity} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Thread */}
            <CommentSection issueId={issue._id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <StatusBadge status={issue.status} />
                <span className="text-xs text-slate-500">Priority Score: {Math.round(issue.priorityScore) || 0}/100</span>
              </div>

              {/* Status Timeline */}
              <div className="border-t border-slate-800/60 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resolution Progress</h4>
                <StatusTimeline currentStatus={issue.status} statusHistory={issue.statusHistory} />
              </div>

              <div className="border-t border-slate-800/60 pt-4 flex flex-col space-y-3.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-550">Category</span>
                  <span className="text-slate-200 font-bold">{issue.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-550">Severity</span>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-550">Assigned Dept.</span>
                  <span className="text-slate-200 font-bold">{issue.department?.name || issue.recommendedDepartment || 'Review Pending'}</span>
                </div>
                {issue.aiConfidence && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-550">AI Confidence</span>
                    <span className="text-teal-400 font-semibold">{Math.round(issue.aiConfidence * 100)}%</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/60 pt-4">
                <UpvoteButton issueId={issue._id} initialVotesCount={issue.votesCount} />
              </div>
            </div>

            {/* Map Snippet */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-4.5 h-4.5 text-teal-400" />
                <span>Geo Coordinates</span>
              </h4>
              <div className="h-44 rounded-xl overflow-hidden border border-slate-800">
                <MapContainer
                  center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[issue.location.coordinates[1], issue.location.coordinates[0]]} />
                </MapContainer>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Coords: {issue.location.coordinates[1].toFixed(5)}, {issue.location.coordinates[0].toFixed(5)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default IssueDetail;
