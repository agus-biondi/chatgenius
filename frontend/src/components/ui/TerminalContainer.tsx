import React from 'react';

interface TerminalContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const TerminalContainer: React.FC<TerminalContainerProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative bg-[var(--terminal-black)] border border-[var(--terminal-green)] rounded-md shadow-lg p-4 circuit-pattern ${className}`}
      style={{
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          boxShadow: '0 0 10px rgba(110, 219, 113, 0.45), inset 0 0 10px rgba(110, 219, 113, 0.45)',
        }}
      />
      {children}
    </div>
  );
}; 