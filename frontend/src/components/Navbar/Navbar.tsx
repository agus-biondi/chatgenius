import { SignOutButton } from '../SignOutButton';
import { useUser } from '@clerk/clerk-react';

export function Navbar() {
    const { user } = useUser();
    
    return (
        <nav className="px-6 py-3 border-b border-[#6edb71] bg-[var(--terminal-black)] flex justify-between items-center">
            <div className="flex items-center gap-6">
                {/* Left side - empty for now */}
            </div>
            <div className="flex items-center gap-6">
                {/* User info */}
                <div className="flex items-center gap-2">
                    <span className="text-[#6edb71]">$</span>
                    <span className="text-[#b8cceb]">whoami</span>
                    <span className="text-[#9ba8b9]">{'=>'}</span>
                    <span className="text-[#6edb71]">{user?.username || user?.emailAddresses[0]?.emailAddress}</span>
                </div>
                <SignOutButton />
            </div>
        </nav>
    );
} 