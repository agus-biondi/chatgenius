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
            className="text-sm text-[#9ba8b9] hover:text-[#db6e7a] transition-colors"
        >
            [logout]
        </button>
    );
} 