import React from 'react';

interface TerminalCommandProps {
  command: string;
  className?: string;
}

export const TerminalCommand: React.FC<TerminalCommandProps> = ({ 
  command,
  className = ''
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="terminal-command-prefix">$</span>
        <span className="terminal-command">{command}</span>
      </div>
    </div>
  );
}; 