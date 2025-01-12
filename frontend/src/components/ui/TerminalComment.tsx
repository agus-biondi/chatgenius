import React from 'react';

interface TerminalCommentProps {
  message: string;
  className?: string;
}

export const TerminalComment: React.FC<TerminalCommentProps> = ({ 
  message,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="terminal-command-prefix">$</span>
      <span className="terminal-comment">{message}</span>
    </div>
  );
}; 