import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, MessageSquare, Share2, ThumbsUp, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusTimeline from './StatusTimeline';
import { Avatar, Badge, severityVariant } from '../ui';
import API from '../../services/api';
import { useSocket } from '../../context/SocketContext';

function IssueCard({ issue }) {
  const {
    _id,
    title,
    description,
    category,
    status,
    severity,
    images,
    address,
    reportedBy,
    votesCount,
    aiConfidence,
    department,
    createdAt,
  } = issue;

  const [supportCount, setSupportCount] = useState(votesCount || 0);
  const [supported, setSupported] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const { socket } = useSocket() || {};

  useEffect(() => {
    const fetchVoteStatus = async () => {
      try {
        const res = await API.get(`/issues/${_id}/vote/status`);
        setSupported(res.data.hasVoted);
      } catch (err) {
        console.error('Failed to get vote status:', err);
      }
    };
    fetchVoteStatus();
  }, [_id]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data) => {
      if (data._id === _id) setCurrentStatus(data.status);
    };
    socket.on('issue:statusUpdated', handleStatusUpdate);
    return () => socket.off('issue:statusUpdated', handleStatusUpdate);
  }, [socket, _id]);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleSupport = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const originalSupported = supported;
    const originalCount = supportCount;

    setSupported(!supported);
    setSupportCount((prev) => (supported ? prev - 1 : prev + 1));

    try {
      if (originalSupported) {
        const res = await API.delete(`/issues/${_id}/vote`);
        setSupportCount(res.data.votesCount);
      } else {
        const res = await API.post(`/issues/${_id}/vote`);
        setSupportCount(res.data.votesCount);
      }
    } catch (err) {
      console.error('Failed to update vote:', err);
      setSupported(originalSupported);
      setSupportCount(originalCount);
    }
  };

  const isResolved = currentStatus === 'resolved';
  const severityLabel = severity === 'emergency' ? 'Urgent' : severity?.charAt(0).toUpperCase() + severity?.slice(1);

  return (
    <Link
      to={`/issues/${_id}`}
      className="block bg-white border border-surface-border rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden transition-shadow duration-200 mb-6"
    >
      {isResolved && (
        <div className="bg-success-50 border-b border-success-500/20 px-5 py-3 flex items-center gap-3">
          <span className="text-success-600 text-sm font-semibold">Issue Resolved</span>
          <span className="text-success-600/70 text-xs">Thanks to community reports</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={reportedBy?.name || 'Citizen'} />
            <div>
              <div className="text-sm font-semibold text-ink">
                {reportedBy?.name || 'Citizen Report'}
              </div>
              <div className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="max-w-[180px] truncate">{address || 'Unknown Location'}</span>
                <span>·</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant={severityVariant(severity)}>
              {severityLabel} Priority
            </Badge>
            <Badge variant="category">{category}</Badge>
          </div>
        </div>

        <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>

        {images && images.length > 0 && (
          <div className="w-full h-56 sm:h-72 rounded-xl overflow-hidden mb-4 bg-surface-muted">
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <p className="text-sm text-ink-secondary mb-4 line-clamp-3">{description}</p>

        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-semibold text-primary-700">Analyzed by CivicConnect AI</span>
          </div>
          <p className="text-sm text-ink-secondary">
            <span className="font-medium text-ink">Classification: </span>
            {category} · Confidence {aiConfidence ? `${Math.round(aiConfidence * 100)}%` : 'N/A'}
            {department?.name && (
              <> · Recommended: {department.name}</>
            )}
          </p>
        </div>

        <div className="bg-surface-muted rounded-xl p-4 border border-surface-border">
          <StatusTimeline currentStatus={currentStatus} />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSupport}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              supported ? 'text-primary-600' : 'text-ink-muted hover:text-primary-600'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${supported ? 'fill-current' : ''}`} />
            <span>
              {supportCount}
              <span className="hidden sm:inline"> Support</span>
            </span>
          </motion.button>

          <span className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Comments</span>
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </Link>
  );
}

export default IssueCard;
