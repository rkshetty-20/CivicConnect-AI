import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import API from '../../services/api';
import useAuth from '../../hooks/useAuth';

function CommentSection({ issueId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComments = async (pageNum = 1) => {
    try {
      const res = await API.get(`/issues/${issueId}/comments`, {
        params: { page: pageNum, limit: 10 },
      });
      if (pageNum === 1) {
        setComments(res.data.comments);
      } else {
        setComments((prev) => [...prev, ...res.data.comments]);
      }
      setTotalPages(res.data.pages);
    } catch (err) {
      setError('Could not load comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [issueId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitLoading) return;

    setSubmitLoading(true);
    setError(null);
    try {
      const res = await API.post(`/issues/${issueId}/comments`, {
        text: newComment.trim(),
      });
      // Prepend the new comment to the list
      setComments((prev) => [res.data, ...prev]);
      setNewComment('');
    } catch (err) {
      setError('Failed to post comment. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage);
  };

  return (
    <div className="space-y-6 pt-6 border-t border-slate-800">
      <h3 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-teal-400" />
        <span>Discussion & Updates</span>
      </h3>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-2 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a helpful update or question..."
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500 transition text-sm"
          required
        />
        <button
          type="submit"
          disabled={submitLoading || !newComment.trim()}
          className="px-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center transition"
        >
          {submitLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Comment thread list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-600">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl flex items-start space-x-3.5"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-teal-400 border border-slate-700/50">
                {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-300">{comment.user?.name || 'Anonymous'}</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-850 text-[10px] text-slate-500 capitalize">
                      {comment.user?.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-550">
                    {new Date(comment.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{comment.text}</p>
              </div>
            </div>
          ))}

          {page < totalPages && (
            <button
              onClick={loadMore}
              className="w-full py-2 bg-slate-900/40 hover:bg-slate-900/80 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-850 hover:border-slate-800 rounded-xl transition"
            >
              Load previous comments
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
