import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../../services/api';

function UpvoteButton({ issueId, initialVotesCount }) {
  const [votes, setVotes] = useState(initialVotesCount || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await API.get(`/issues/${issueId}/vote/status`);
        setHasVoted(res.data.hasVoted);
      } catch (err) {
        console.error('Error fetching vote status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [issueId]);

  const handleVote = async () => {
    if (actionLoading) return;
    setActionLoading(true);

    // Optimistic UI updates
    const previousHasVoted = hasVoted;
    const previousVotes = votes;

    setHasVoted(!previousHasVoted);
    setVotes(previousVotes + (previousHasVoted ? -1 : 1));

    try {
      if (previousHasVoted) {
        // Remove vote
        const res = await API.delete(`/issues/${issueId}/vote`);
        setVotes(res.data.votesCount);
      } else {
        // Add vote
        const res = await API.post(`/issues/${issueId}/vote`);
        setVotes(res.data.votesCount);
      }
    } catch (err) {
      console.error('Failed to update vote:', err);
      // Revert if API call fails
      setHasVoted(previousHasVoted);
      setVotes(previousVotes);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-slate-800 text-slate-500 border border-slate-700/50">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleVote}
      disabled={actionLoading}
      className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold border transition duration-300 ${
        hasVoted
          ? 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 shadow-md'
      }`}
    >
      <Heart className={`w-4 h-4 transition ${hasVoted ? 'fill-rose-500 text-rose-500' : ''}`} />
      <span className="text-sm">{votes}</span>
      <span className="text-xs font-normal text-slate-500">citizens support this</span>
    </motion.button>
  );
}

export default UpvoteButton;
