import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { getIssues, getIssueById } from '../services/issueService';
import { useSocket } from '../context/SocketContext';

const PAGE_SIZE = 10;

function buildParams({ page, category, status, search }) {
  const params = { page, limit: PAGE_SIZE };
  if (category && category !== 'All') params.category = category;
  if (status && status !== 'All') params.status = status;
  if (search?.trim()) params.search = search.trim();
  return params;
}

export function useIssuesFeed({ category, status, search }) {
  const queryClient = useQueryClient();
  const { socket } = useSocket() || {};

  const query = useInfiniteQuery({
    queryKey: ['issues', category, status, search],
    queryFn: ({ pageParam = 1 }) =>
      getIssues(buildParams({ page: pageParam, category, status, search })),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });

  const prependIssue = useCallback(
    (issue) => {
      queryClient.setQueryData(['issues', category, status, search], (old) => {
        if (!old?.pages?.length) return old;

        const exists = old.pages.some((page) =>
          page.issues.some((i) => i._id === issue._id)
        );
        if (exists) return old;

        const [firstPage, ...rest] = old.pages;
        return {
          ...old,
          pages: [
            { ...firstPage, issues: [issue, ...firstPage.issues] },
            ...rest,
          ],
        };
      });
    },
    [queryClient, category, status, search]
  );

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewIssue = async (data) => {
      try {
        const issue = await getIssueById(data._id);
        prependIssue(issue);
      } catch (err) {
        console.warn('[Feed] Failed to prepend new issue:', err.message);
      }
    };

    socket.on('issue:created', handleNewIssue);
    return () => socket.off('issue:created', handleNewIssue);
  }, [socket, prependIssue]);

  const issues = query.data?.pages.flatMap((page) => page.issues) ?? [];

  return {
    ...query,
    issues,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}

export default useIssuesFeed;
