import { User } from '../../types';

interface UserListProps {
    users: User[];
}

export function UserList({ users }: UserListProps) {
    return (
        <div className="p-4 border-t border-[#6edb71] overflow-y-auto">
            <div className="mb-2 text-[#6edb71]">$ ls ./users/</div>
            {users.length === 0 ? (
                <div className="text-[#9ba8b9]">No active users</div>
            ) : (
                <div className="flex flex-col gap-1">
                    {users.map(user => (
                        <div key={user.userId} className="flex items-center gap-2">
                            <span className="text-[#6edb71]">-</span>
                            <span className="text-[#b8cceb]">
                                {user.username}
                                {user.isCurrentUser && (
                                    <span className="text-[#9ba8b9] ml-1">(you)</span>
                                )}
                            </span>
                            {user.role === 'ADMIN' && (
                                <span className="text-[#db6e7a] text-sm">[admin]</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 