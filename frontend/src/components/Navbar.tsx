import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import { TerminalContainer } from './ui/TerminalContainer';
import { TerminalPrompt } from './ui/TerminalPrompt';

export const Navbar: React.FC = () => {
  const { signOut } = useClerk();

  return (
    <TerminalContainer className="w-full">
      <div className="flex justify-between items-center">
      <div className="p-0">
        <h1 className="tracking-wider font-bold text-[var(--terminal-green)] font-mono text-xl">ELECTRO_CHAT_9000</h1>
        <div className="text-xs text-[#9ba8b9] mt-1">Tomorrow's Communication, Today</div>
      </div>
        <div className="flex items-center gap-4">
          <TerminalPrompt
            command="config"
            onClick={() => {/* TODO: Add config modal */}}
          />
          <TerminalPrompt
            command="logout"
            onClick={() => signOut()}
          />
        </div>
      </div>
    </TerminalContainer>
  );
}; 