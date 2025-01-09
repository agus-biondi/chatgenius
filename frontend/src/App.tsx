import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, SignedOut } from '@clerk/clerk-react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

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
                            <MainLayout />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/sign-in" replace />} />
            </Routes>
        </div>
    );
}

export default App;
