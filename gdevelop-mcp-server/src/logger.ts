import pino from 'pino';

/**
 * Logger configured for MCP STDIO transport.
 * CRITICAL: All logs go to stderr to avoid corrupting JSON-RPC messages on stdout.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: 2, // stderr file descriptor
    },
  },
});

/**
 * Create a child logger with a specific component name.
 */
export function createLogger(component: string) {
  return logger.child({ component });
}
