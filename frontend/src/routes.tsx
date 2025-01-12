import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, SignedOut } from '@clerk/clerk-react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

function AuthLayout() {
    const isSignIn = window.location.pathname.includes('sign-in');
    
    return (
        <div className="relative flex flex-col h-screen items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-[#6edb71]">ELECTRO_CHAT_9000</h1>
            <div className="p-4 border border-[#6edb71] bg-[var(--terminal-black)]">
                <h2 className="text-xl mb-4 text-[#6edb71]">
                    {isSignIn ? "Sign In" : "Sign Up"}
                </h2>
                {isSignIn ? <SignIn /> : <SignUp />}
            </div>
        </div>
    );
}

export function AppRoutes() {
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
            </Routes>
        </div>
    );
} 