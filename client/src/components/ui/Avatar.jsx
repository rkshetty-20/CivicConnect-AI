import classNames from 'classnames';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

function Avatar({ name, size = 'md', className }) {
  const initial = (name?.charAt(0) || 'C').toUpperCase();

  return (
    <div
      className={classNames(
        'rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export default Avatar;
