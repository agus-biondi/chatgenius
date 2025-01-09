import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function SignOutButton() {
    const { signOut } = useClerk();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/sign-in');
    };

    return (
        <button
            onClick={handleSignOut}
            className="text-xs text-[var(--terminal-dim-green)] hover:text-[var(--terminal-green)] transition-colors"
        >
            $ logout
        </button>
    );
} 