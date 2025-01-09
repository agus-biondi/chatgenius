import { SignOutButton } from '../SignOutButton';
import { useUser } from '@clerk/clerk-react';

export function Navbar() {
    const { user } = useUser();
    
    return (
        <nav className="px-6 py-3 border-b border-[var(--terminal-green)] bg-[var(--terminal-black)] flex justify-between items-center">
            <div className="flex items-center gap-6">
                {/* Left side controls */}
                <button className="text-xs text-[var(--terminal-dim-green)] hover:text-[var(--terminal-green)] transition-colors opacity-50 cursor-not-allowed">
                    $ settings
                </button>
                <button className="text-xs text-[var(--terminal-dim-green)] hover:text-[var(--terminal-green)] transition-colors opacity-50 cursor-not-allowed">
                    $ theme
                </button>
            </div>
            <div className="flex items-center gap-6">
                {/* User info */}
                <span className="text-xs text-[var(--terminal-dim-green)]">
                    $ user: <span className="text-[var(--terminal-green)]">{user?.username || user?.emailAddresses[0]?.emailAddress}</span>
                </span>
                <SignOutButton />
            </div>
        </nav>
    );
} 