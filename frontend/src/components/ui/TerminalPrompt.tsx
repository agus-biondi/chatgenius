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
  const content = (
    <>
      <span className="terminal-prompt-prefix">$</span>
      <span>{command}</span>
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick} 
        className={`terminal-prompt focus-ring ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`terminal-prompt ${className}`}>
      {content}
    </div>
  );
}; 