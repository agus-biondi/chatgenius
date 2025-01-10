import { SignOutButton } from '../SignOutButton';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { UserSettingsPanel } from '../UserSettingsPanel/UserSettingsPanel';
import { userService } from '../../services/userService';
import type { User } from '../../types';

export function Navbar() {
    const { user } = useUser();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentUserData, setCurrentUserData] = useState<User | null>(null);
    
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSettingsOpen) {
                setIsSettingsOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isSettingsOpen]);

    useEffect(() => {
        if (!user?.id) return;

        const fetchUsers = async () => {
            try {
                const activeUsers = await userService.getActiveUsers();
                const currentUser = activeUsers.find(u => u.userId === user.id);
                if (currentUser) {
                    setCurrentUserData(currentUser);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, [user?.id]);

    return (
        <>
            <nav className="px-6 py-3 border-b border-[#6edb71] bg-[var(--terminal-black)] flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6">
                    {/* Left side - empty for now */}
                </div>
                <div className="flex items-center gap-6">
                    {/* User info */}
                    <div className="flex items-center gap-2 group">
                        <span className="text-[#6edb71]">$</span>
                        <span className="text-[#b8cceb]">whoami</span>
                        <span className="text-[#9ba8b9]">{'=>'}</span>
                        <span className="text-[#6edb71]">{currentUserData?.username || user?.emailAddresses[0]?.emailAddress}</span>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-[#9ba8b9] hover:text-[#6edb71] ml-2 cursor-pointer"
                        >
                            [config]
                        </button>
                    </div>
                    <SignOutButton />
                </div>
            </nav>
            {currentUserData && (
                <UserSettingsPanel 
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    currentUserData={currentUserData}
                />
            )}
        </>
    );
} 