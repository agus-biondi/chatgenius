import { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';

interface NotificationState {
    unreadCounts: Record<string, number>;
    currentChannelId: string | null;
}

type NotificationAction =
    | { type: 'SET_CURRENT_CHANNEL'; channelId: string | null }
    | { type: 'INCREMENT_UNREAD'; channelId: string }
    | { type: 'CLEAR_UNREAD'; channelId: string }
    | { type: 'CLEAR_ALL_UNREAD' };

interface NotificationContextType {
    state: NotificationState;
    setCurrentChannel: (channelId: string | null) => void;
    incrementUnread: (channelId: string) => void;
    clearUnread: (channelId: string) => void;
    clearAllUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
    switch (action.type) {
        case 'SET_CURRENT_CHANNEL':
            if (action.channelId) {
                const { [action.channelId]: _, ...rest } = state.unreadCounts;
                return {
                    currentChannelId: action.channelId,
                    unreadCounts: rest
                };
            }
            return { ...state, currentChannelId: null };

        case 'INCREMENT_UNREAD':
            if (action.channelId === state.currentChannelId) return state;
            return {
                ...state,
                unreadCounts: {
                    ...state.unreadCounts,
                    [action.channelId]: (state.unreadCounts[action.channelId] || 0) + 1
                }
            };

        case 'CLEAR_UNREAD':
            const { [action.channelId]: _, ...rest } = state.unreadCounts;
            return {
                ...state,
                unreadCounts: rest
            };

        case 'CLEAR_ALL_UNREAD':
            return {
                ...state,
                unreadCounts: {}
            };

        default:
            return state;
    }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(notificationReducer, {
        unreadCounts: {},
        currentChannelId: null
    });

    const setCurrentChannel = useCallback((channelId: string | null) => {
        if (channelId === state.currentChannelId) return;
        dispatch({ type: 'SET_CURRENT_CHANNEL', channelId });
    }, [state.currentChannelId]);

    const incrementUnread = useCallback((channelId: string) => {
        if (channelId === state.currentChannelId) return;
        dispatch({ type: 'INCREMENT_UNREAD', channelId });
    }, [state.currentChannelId]);

    const clearUnread = useCallback((channelId: string) => 
        dispatch({ type: 'CLEAR_UNREAD', channelId }), []);

    const clearAllUnread = useCallback(() => 
        dispatch({ type: 'CLEAR_ALL_UNREAD' }), []);

    const contextValue = useMemo(() => ({
        state,
        setCurrentChannel,
        incrementUnread,
        clearUnread,
        clearAllUnread
    }), [
        state,
        setCurrentChannel,
        incrementUnread,
        clearUnread,
        clearAllUnread
    ]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
} 