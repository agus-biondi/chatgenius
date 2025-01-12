import React from 'react';

interface SidebarListItemProps {
  name: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  isSelected?: boolean;
}

export const SidebarListItem: React.FC<SidebarListItemProps> = ({ 
  name, 
  onClick,
  onMouseEnter,
  onDelete,
  showDelete,
  isSelected
}) => {
  const content = (
    <>
      <div className="flex items-center space-x-2 flex-grow">
        <span className="sidebar-list-item-prefix">&gt;</span>
        <span>{name}</span>
      </div>
      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete?.();
          }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200 font-mono flex items-center px-3 py-2 -my-2 -mr-2 hover:bg-[var(--terminal-hover)] group/delete"
          aria-label="Delete channel"
        >
          <span className="text-[var(--terminal-red)] group-hover/delete:text-[var(--terminal-red)]">$</span>
          <span className="text-[var(--terminal-gray)] group-hover/delete:text-[var(--terminal-red)] ml-1">rm</span>
        </button>
      )}
    </>
  );

  const baseClasses = "sidebar-list-item focus-ring group";
  const selectedClasses = isSelected ? "bg-[var(--hover-gray)] text-[var(--terminal-green)]" : "";

  return (
    <div 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`${baseClasses} ${selectedClasses}`}
    >
      {content}
    </div>
  );
} 