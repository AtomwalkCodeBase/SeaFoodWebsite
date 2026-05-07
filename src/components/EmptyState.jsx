export const EmptyState = ({ message, className = "" }) => {
  return (
    <div className={`text-center p-4 text-(--text-light) bg-(--card-bg) rounded-md ${className}`}>
      {message}
    </div>
  );
};

export const SectionHeader = ({ icon, title, sub }) => (
    <div className="p-2  border-b border-border">
        <div className="text-base font-bold flex items-center gap-2.5 text-text">
            <span>{icon}</span> {title}
        </div>
        {sub && <div className="text-xs text-textLight mt-1">{sub}</div>}
    </div>
);