export const EmptyState = ({ message, className = "" }) => {
  return (
    <div className={`text-center p-4 text-(--text-light) bg-(--card-bg) rounded-md ${className}`}>
      {message}
    </div>
  );
};