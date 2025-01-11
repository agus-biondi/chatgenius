import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('state', 'WebSocket error caught', { error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex items-center justify-center text-[#db6e7a]">
                    <div className="flex flex-col items-center gap-2">
                        <div>$ connection_error</div>
                        <div>WebSocket connection failed. Please refresh the page.</div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
} 