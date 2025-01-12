import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes';
import { useWebSocketConnection } from './hooks/websocket/useWebSocketConnection';

const queryClient = new QueryClient();

function AppContent() {
  const { isLoaded } = useAuth();
  useWebSocketConnection();

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--terminal-black)] text-[var(--text-primary)]">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;

