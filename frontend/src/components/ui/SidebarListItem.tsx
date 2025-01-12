import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarListItemProps {
  name: string;
  to?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const SidebarListItem: React.FC<SidebarListItemProps> = ({ 
  name, 
  to, 
  onClick,
  onMouseEnter,
  onDelete,
  showDelete
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
            e.preventDefault(); // Prevent navigation if it's a Link
            e.stopPropagation(); // Prevent parent click
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

  if (to) {
    return (
      <Link
        to={to}
        onMouseEnter={onMouseEnter}
        className="sidebar-list-item focus-ring group"
      >
        {content}
      </Link>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="sidebar-list-item focus-ring group"
    >
      {content}
    </div>
  );
}; 