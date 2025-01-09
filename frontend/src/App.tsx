import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Channel } from './types';
import { channelService } from './services/channelService';
import { websocketService } from './services/websocketService';
import { userService } from './services/userService';
import { ChannelList } from './components/Sidebar/ChannelList';
import { CreateChannelButton } from './components/Sidebar/CreateChannelButton';
import { ChatArea } from './components/ChatArea';
import { SignIn, SignUp, SignedOut, useUser } from '@clerk/clerk-react';
import { ProtectedRoute } from './components/ProtectedRoute';

function ChatLayout() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();

    const fetchChannels = async () => {
        setIsLoading(true);
        try {
            const fetchedChannels = await channelService.getChannels();
            setChannels(fetchedChannels);
            if (fetchedChannels.length > 0 && !selectedChannelId) {
                setSelectedChannelId(fetchedChannels[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch channels:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            websocketService.initialize();
            fetchChannels();
            userService.syncUserWithBackend(user);
        }
        return () => {
            websocketService.disconnect();
        };
    }, [user]);

    return (
        <div className="relative flex h-screen p-4 gap-4">
            {/* Sidebar */}
            <div className="w-72 flex flex-col terminal-window overflow-hidden">
                <div className="p-4 border-b border-[var(--terminal-green)]">
                    <h1 className="text-xl font-bold tracking-wider cursor">ELECTRO_CHAT_9000</h1>
                    <div className="text-xs text-[var(--terminal-dim-green)] mt-1">Tomorrow's Communication, Today</div>
                </div>
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
                        Loading channels...
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        <ChannelList
                            channels={channels}
                            selectedChannelId={selectedChannelId}
                            onSelectChannel={setSelectedChannelId}
                            currentUser={{ role: user?.publicMetadata?.role as string || 'USER' }}
                        />
                        <CreateChannelButton onChannelCreated={fetchChannels} />
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 terminal-window overflow-hidden">
                <ChatArea channelId={selectedChannelId} />
            </div>
        </div>
    );
}

function AuthLayout() {
    const isSignIn = window.location.pathname.includes('sign-in');
    
    return (
        <div className="relative flex flex-col h-screen items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-[var(--terminal-green)]">ELECTRO_CHAT_9000</h1>
            <div className="p-4 border border-[var(--terminal-green)] bg-[var(--terminal-black)]">
                <h2 className="text-xl mb-4 text-[var(--terminal-green)]">
                    {isSignIn ? "Sign In" : "Sign Up"}
                </h2>
                {isSignIn ? <SignIn /> : <SignUp />}
            </div>
        </div>
    );
}

function App() {
    return (
        <div className="relative min-h-screen bg-[var(--terminal-black)]">
            {/* Circuit board background pattern */}
            <div className="absolute inset-0 circuit-pattern" />
            
            {/* CRT scanline effect */}
            <div className="crt-overlay" />
            
            {/* Main content */}
            <Routes>
                <Route
                    path="/sign-in/*"
                    element={
                        <SignedOut>
                            <AuthLayout />
                        </SignedOut>
                    }
                />
                <Route
                    path="/sign-up/*"
                    element={
                        <SignedOut>
                            <AuthLayout />
                        </SignedOut>
                    }
                />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <ChatLayout />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/sign-in" replace />} />
            </Routes>
        </div>
    );
}

export default App;
