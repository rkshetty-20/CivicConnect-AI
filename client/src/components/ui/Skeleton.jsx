import classNames from 'classnames';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={classNames(
        'animate-pulse rounded-lg bg-surface-border/80',
        className
      )}
      {...props}
    />
  );
}

export function IssueCardSkeleton() {
  return (
    <div className="bg-white border border-surface-border rounded-2xl shadow-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export default Skeleton;
