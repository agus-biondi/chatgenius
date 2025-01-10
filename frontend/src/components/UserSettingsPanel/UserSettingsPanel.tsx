import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createPortal } from 'react-dom';
import { userService } from '../../services/userService';
import type { User } from '../../types';

interface UserSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserData: User;
}

export function UserSettingsPanel({ isOpen, onClose, currentUserData }: UserSettingsPanelProps) {
    const { user } = useUser();
    const [displayName, setDisplayName] = useState(currentUserData.username);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);

    const validateDisplayName = (name: string): boolean => {
        if (name.length < 3) {
            setNameError('Display name must be at least 3 characters long');
            return false;
        }
        if (name.length > 30) {
            setNameError('Display name must be at most 30 characters long');
            return false;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            setNameError('Display name can only contain letters, numbers, underscores, and hyphens');
            return false;
        }
        setNameError(null);
        return true;
    };

    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setDisplayName(newName);
        if (newName) {
            validateDisplayName(newName);
        } else {
            setNameError(null);
        }
    };

    const handleDisplayNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || isLoading || !user) return;
        if (!validateDisplayName(displayName)) return;
        
        setIsLoading(true);
        setNameSuccess(null);
        try {
            await userService.updateUsername(user.id, displayName.trim());
            setNameSuccess('Success: Display name updated');
            setNameError(null);
        } catch (error) {
            console.error('Failed to update display name:', error);
            setNameError('Failed to update display name. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!status.trim() || isLoading) return;
        
        setIsLoading(true);
        // TODO: API call to update status
        setIsLoading(false);
    };

    const handleMouseDown = () => {
        setIsDragging(false);
    };

    const handleMouseMove = () => {
        setIsDragging(true);
    };

    const handleOverlayClick = () => {
        if (!isDragging) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const userIdentifier = user?.emailAddresses[0]?.emailAddress || user?.username || 'unknown';

    const modal = (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center pt-10" 
            style={{ zIndex: 9999 }}
            onClick={handleOverlayClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
        >
            <div 
                className="bg-[var(--terminal-black)] border border-[#6edb71] p-6 w-[600px]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <div className="w-4 text-[#6edb71] flex items-center justify-center">$</div>
                        <span className="text-[#b8cceb]">cd config/{userIdentifier}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#9ba8b9] hover:text-[#db6e7a]"
                    >
                        [esc]
                    </button>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Display Name Section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[#b8cceb] border-b border-[#6edb71] pb-2">Display Name</h3>
                        <form onSubmit={handleDisplayNameSubmit} className="flex flex-col gap-2">
                            <div className="flex items-center">
                                <div className="w-4 text-[#6edb71] flex items-center justify-center">$</div>
                                <span className="text-[#b8cceb]">config --set-display-name \</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 text-[#6edb71] flex items-center justify-center">$</div>
                                <div className="flex-1 pl-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={handleDisplayNameChange}
                                            className={`flex-1 h-8 bg-[var(--terminal-gray)] text-[#b8cceb] px-2 outline-none border border-transparent focus:border-[#6edb71] transition-colors ${
                                                nameError ? 'border-[#db6e7a]' : ''
                                            }`}
                                            placeholder="display_name"
                                        />
                                        <button
                                            type="submit"
                                            className="text-[#9ba8b9] hover:text-[#6edb71]"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? '[wait]' : '[enter]'}
                                        </button>
                                    </div>
                                    {nameError && (
                                        <div className="text-[#db6e7a] text-sm mt-1">
                                            Error: {nameError}
                                        </div>
                                    )}
                                    {nameSuccess && (
                                        <div className="text-[#6edb71] text-sm mt-1">
                                            {nameSuccess}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Status Section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[#b8cceb] border-b border-[#6edb71] pb-2">Current Status</h3>
                        <form onSubmit={handleStatusSubmit} className="flex flex-col gap-2">
                            <div className="flex items-center">
                                <div className="w-4 text-[#6edb71] flex items-center justify-center">$</div>
                                <span className="text-[#b8cceb]">config --set-status \</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 text-[#6edb71] flex items-center justify-center">$</div>
                                <div className="flex-1 pl-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="flex-1 h-8 bg-[var(--terminal-gray)] text-[#b8cceb] px-2 outline-none border border-transparent focus:border-[#6edb71] transition-colors"
                                                placeholder="current_status"
                                            />
                                            <button
                                                type="submit"
                                                className="text-[#9ba8b9] hover:text-[#6edb71]"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? '[wait]' : '[enter]'}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStatus('🟢 online')}
                                            className="h-8 px-2 text-[#9ba8b9] hover:text-[#6edb71] hover:bg-[var(--terminal-gray)] transition-colors"
                                        >
                                            [online]
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatus('🟡 away')}
                                            className="h-8 px-2 text-[#9ba8b9] hover:text-[#6edb71] hover:bg-[var(--terminal-gray)] transition-colors"
                                        >
                                            [away]
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
} 