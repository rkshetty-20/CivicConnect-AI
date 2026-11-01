import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, MapPin, SlidersHorizontal } from 'lucide-react';
import FeedLayout from '../../components/layout/FeedLayout';
import IssueCard from '../../components/issues/IssueCard';
import CreatePostCard from '../../components/issues/CreatePostCard';
import TrendingSidebar from '../../components/issues/TrendingSidebar';
import { Card, IssueCardSkeleton } from '../../components/ui';
import { getIssues } from '../../services/issueService';

const CATEGORIES = ['All', 'Garbage', 'Roads', 'Water', 'Electricity', 'Sewage', 'Streetlights', 'Parks', 'Public Transport'];
const STATUSES = ['All', 'pending', 'in_progress', 'resolved'];

function IssueFeed() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (category !== 'All') params.category = category;
      if (status !== 'All') params.status = status;

      const data = await getIssues(params);
      setIssues(data.issues);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [category, status]);

  useEffect(() => {
    fetchIssues();
  }, [category, status, page]);

  const filtered = search.trim()
    ? issues.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.description.toLowerCase().includes(search.toLowerCase())
      )
    : issues;

  return (
    <FeedLayout>
      <div className="w-full max-w-2xl px-4 sm:px-6 py-6 lg:py-8">
        <CreatePostCard />

        <Card className="mb-6 sticky top-4 z-40">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 m-auto w-4 h-4 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search community issues..."
                className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-surface-border rounded-xl text-ink text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                showFilters
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-ink-secondary border-surface-border hover:bg-surface-muted'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-surface-border space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        category === cat
                          ? 'bg-primary-50 text-primary-700 border-primary-200'
                          : 'bg-white text-ink-secondary border-surface-border hover:border-primary-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border capitalize ${
                        status === s
                          ? 'bg-primary-50 text-primary-700 border-primary-200'
                          : 'bg-white text-ink-secondary border-surface-border hover:border-primary-200'
                      }`}
                    >
                      {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <IssueCardSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-5 bg-critical-50 border border-critical-500/20 rounded-2xl text-critical-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-surface-border border-dashed">
            <MapPin className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <p className="text-ink font-semibold">No issues found</p>
            <p className="text-ink-muted text-sm mt-1">Try changing filters or report the first issue in your community.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            {filtered.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-5 py-2 bg-white hover:bg-surface-muted disabled:opacity-40 text-sm font-medium rounded-xl border border-surface-border transition-colors text-ink-secondary"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-ink-muted bg-white px-4 py-2 rounded-xl border border-surface-border">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2 bg-white hover:bg-surface-muted disabled:opacity-40 text-sm font-medium rounded-xl border border-surface-border transition-colors text-ink-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <TrendingSidebar />
    </FeedLayout>
  );
}

export default IssueFeed;
