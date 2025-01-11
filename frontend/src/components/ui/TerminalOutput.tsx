import React from 'react';

interface TerminalOutputProps {
  message: string | React.ReactNode;
  className?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ message, className }) => {
  return (
    <div className={`terminal-output ${className}`}>
      &gt;&gt; {message}
    </div>
  );
}; 