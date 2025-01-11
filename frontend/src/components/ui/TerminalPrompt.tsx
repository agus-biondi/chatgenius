import React from 'react';

interface TerminalPromptProps {
  command: string;
  onClick?: () => void;
  className?: string;
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({ 
  command, 
  onClick, 
  className = '' 
}) => {
  return (
    <div className={`group flex items-center ${className}`}>
      <span className="terminal-prompt-prefix">$</span>
      {onClick ? (
        <button 
          onClick={onClick} 
          className="terminal-prompt focus-ring"
        >
          {command}
        </button>
      ) : (
        <span className="terminal-prompt">{command}</span>
      )}
    </div>
  );
}; 