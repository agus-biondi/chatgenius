import React, { memo } from 'react';
import { withRenderLogging } from '../utils/withRenderLogging';
import { TerminalButton } from './buttons/TerminalButton';

const NavbarBase: React.FC = () => {
  return (
    <div className="relative mb-4">
      {/* Main navbar container with border */}
      <div className="terminal-component">
        <div className="flex justify-between items-center">
          {/* Branding */}
          <div>
            <h1 className="text-2xl font-bold text-[#6edb71] font-['Roboto_Mono']">
              ELECTRO_CHAT_9000
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-['Roboto_Mono']">
              Tomorrow's communication today
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <TerminalButton>
              [config]
            </TerminalButton>
            <TerminalButton>
              [logout]
            </TerminalButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// Apply memo before withRenderLogging to properly track re-renders
const MemoizedNavbar = memo(NavbarBase);
export const Navbar = withRenderLogging(MemoizedNavbar, 'Navbar'); 