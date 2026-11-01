import classNames from 'classnames';

const variants = {
  default: 'bg-surface-muted text-ink-secondary border-surface-border',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-50 text-success-600 border-success-500/20',
  warning: 'bg-warning-50 text-warning-600 border-warning-500/20',
  critical: 'bg-critical-50 text-critical-600 border-critical-500/20',
  category: 'bg-surface-muted text-ink-secondary border-surface-border',
};

function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function severityVariant(severity) {
  switch (severity) {
    case 'emergency':
      return 'critical';
    case 'high':
      return 'warning';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
}

export function statusVariant(status) {
  switch (status) {
    case 'resolved':
      return 'success';
    case 'in_progress':
      return 'primary';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

export default Badge;
