import React from 'react';

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const TerminalButton: React.FC<TerminalButtonProps> = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`px-2 py-2 text-[#9ba8b9] hover:bg-[var(--terminal-gray)] transition-colors duration-200 font-['Roboto_Mono'] rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}; 