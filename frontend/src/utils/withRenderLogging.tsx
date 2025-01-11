import React, { useEffect, useRef } from 'react';
import { logger } from './logger';

// Helper to safely get prop value for logging
const getLogSafePropValue = (value: unknown): unknown => {
    if (React.isValidElement(value)) {
        return '[React Element]';
    }
    if (typeof value === 'function') {
        return `[Function: ${value.name || 'anonymous'}]`;
    }
    if (value instanceof Node) {
        return '[DOM Node]';
    }
    if (Array.isArray(value)) {
        return value.map(getLogSafePropValue);
    }
    if (value && typeof value === 'object') {
        const safeObj: Record<string, unknown> = {};
        Object.entries(value).forEach(([key, val]) => {
            // Skip React internals and complex objects
            if (!key.startsWith('_') && !key.startsWith('$')) {
                safeObj[key] = getLogSafePropValue(val);
            }
        });
        return safeObj;
    }
    return value;
};

export function withRenderLogging<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName: string
) {
    return function WithRenderLogging(props: P) {
        const renderCount = useRef(0);
        const prevProps = useRef<Record<string, unknown>>();

        useEffect(() => {
            renderCount.current += 1;
            
            // Convert current props to safe format
            const currentProps = Object.entries(props).reduce((acc, [key, value]) => {
                acc[key] = getLogSafePropValue(value);
                return acc;
            }, {} as Record<string, unknown>);

            // Calculate changed props
            const changedProps = Object.entries(currentProps).reduce((acc, [key, value]) => {
                if (prevProps.current && prevProps.current[key] !== value) {
                    acc[key] = {
                        previous: prevProps.current[key],
                        current: value
                    };
                }
                return acc;
            }, {} as Record<string, { previous: unknown; current: unknown }>);

            // Log render with safe props
            logger.debug('render', `${componentName} rendered (${renderCount.current})`, {
                renderCount: renderCount.current,
                changedProps: Object.keys(changedProps).length > 0 ? changedProps : undefined,
                props: import.meta.env.DEV ? currentProps : undefined
            });

            prevProps.current = currentProps;
        });

        return <WrappedComponent {...props} />;
    };
} 