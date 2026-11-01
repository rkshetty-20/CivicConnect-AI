import classNames from 'classnames';

function Card({ children, className, padding = true, hover = false, ...props }) {
  return (
    <div
      className={classNames(
        'bg-white border border-surface-border rounded-2xl shadow-card',
        padding && 'p-5',
        hover && 'hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
