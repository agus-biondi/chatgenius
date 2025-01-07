import { User } from '../../types';

interface UserListProps {
    users: User[];
}

export function UserList({ users }: UserListProps) {
    return (
        <div className="p-4 border-t border-[var(--terminal-dim-green)]">
            <div className="mb-2 opacity-70 font-bold text-lg">$ ls users/</div>
            {users.length === 0 ? (
                <div className="opacity-70">No other active users</div>
            ) : (
                <div className="flex flex-col gap-1">
                    {users.map(user => (
                        <div key={user.userId} className="flex items-center gap-2">
                            <span className="text-[var(--terminal-green)]">-</span>
                            <span className="text-[var(--text-primary)]">{user.username}</span>
                            {user.role === 'ADMIN' && (
                                <span className="text-[var(--terminal-dim-green)] text-sm">[admin]</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 