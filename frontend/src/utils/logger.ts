type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'clerk' | 'api' | 'render' | 'state' | 'general';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    data?: unknown;
}

const ENABLE_LOGGING = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true';
const LOG_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug';
const LOG_CATEGORIES: LogCategory[] = (import.meta.env.VITE_LOG_CATEGORIES as LogCategory[]) || ['clerk', 'api', 'render', 'state', 'general'];

const categoryColors = {
    clerk: '#9b59b6',   // Purple
    api: '#3498db',     // Blue
    render: '#2ecc71',  // Green
    state: '#e67e22',   // Orange
    general: '#95a5a6'  // Gray
} as const;

// Function to safely handle circular references in objects
const safeStringify = (obj: unknown, indent = 2): string => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        // Handle special React cases
        if (key === '_owner' || key === '_store' || key === 'ref') {
            return '[React Internal]';
        }
        if (key === 'children' && typeof value === 'object') {
            return '[React Children]';
        }
        // Handle DOM nodes
        if (value instanceof Node) {
            return '[DOM Node]';
        }
        // Handle functions
        if (typeof value === 'function') {
            return `[Function: ${value.name || 'anonymous'}]`;
        }
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    }, indent);
};

const shouldLog = (level: LogLevel, category: LogCategory): boolean => {
    if (!ENABLE_LOGGING) return false;
    if (!LOG_CATEGORIES.includes(category)) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(LOG_LEVEL);
};

const formatLogEntry = ({ timestamp, level, category, message, data }: LogEntry): string => {
    const colorMap = {
        debug: '#6edb71',   // Terminal green
        info: '#6e8adb',    // Terminal blue
        warn: '#db6e7a',    // Terminal orange
        error: '#ff0000'    // Red
    };

    return `%c${timestamp} %c[${level.toUpperCase()}] %c[${category}] %c${message}${data ? '\n' + safeStringify(data) : ''}`;
};

const getConsoleMethod = (level: LogLevel): keyof Console => {
    switch (level) {
        case 'debug': return 'debug';
        case 'info': return 'info';
        case 'warn': return 'warn';
        case 'error': return 'error';
        default: return 'log';
    }
};

const createLogEntry = (level: LogLevel, category: LogCategory, message: string, data?: unknown): LogEntry => ({
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data
});

export const logger = {
    debug: (category: LogCategory, message: string, data?: unknown) => {
        if (shouldLog('debug', category)) {
            const entry = createLogEntry('debug', category, message, data);
            const formattedMessage = formatLogEntry(entry);
            console.debug(
                formattedMessage,
                'color: gray',
                'color: #6edb71',
                `color: ${categoryColors[category]}`,
                'color: inherit'
            );
        }
    },

    info: (category: LogCategory, message: string, data?: unknown) => {
        if (shouldLog('info', category)) {
            const entry = createLogEntry('info', category, message, data);
            const formattedMessage = formatLogEntry(entry);
            console.info(
                formattedMessage,
                'color: gray',
                'color: #6e8adb',
                `color: ${categoryColors[category]}`,
                'color: inherit'
            );
        }
    },

    warn: (category: LogCategory, message: string, data?: unknown) => {
        if (shouldLog('warn', category)) {
            const entry = createLogEntry('warn', category, message, data);
            const formattedMessage = formatLogEntry(entry);
            console.warn(
                formattedMessage,
                'color: gray',
                'color: #db6e7a',
                `color: ${categoryColors[category]}`,
                'color: inherit'
            );
        }
    },

    error: (category: LogCategory, message: string, data?: unknown) => {
        if (shouldLog('error', category)) {
            const entry = createLogEntry('error', category, message, data);
            const formattedMessage = formatLogEntry(entry);
            console.error(
                formattedMessage,
                'color: gray',
                'color: red',
                `color: ${categoryColors[category]}`,
                'color: inherit'
            );
        }
    }
}; 