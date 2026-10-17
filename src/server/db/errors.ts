/**
 * Server-side Database Error Handling
 * 
 * In accordance with Phase 2 requirements:
 * 1. Sanitizes error output (never expose SQL queries, credentials, or stack traces to callers)
 * 2. In production: logs on the server and throws safe DatabaseError (NEVER serves fake mock data in production)
 * 3. In development: provides controlled fallback when database is unreachable so local developer preview works
 */

export class DatabaseError extends Error {
  public readonly code: string;

  constructor(message = 'Database operation failed', code = 'DATABASE_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

/**
 * Checks whether an error is caused by unreachable database connection
 */
export function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as { code?: string; message?: string };
  if (err.code && ['P1000', 'P1001', 'P1002', 'P1003', 'P1017'].includes(err.code)) {
    return true;
  }

  const message = String(err.message || '').toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes('econnrefused') ||
    message.includes('connection refused') ||
    message.includes('timed out') ||
    message.includes('authentication failed')
  );
}

/**
 * Robust, production-safe database error handler.
 */
export function handleDbError<T>(
  error: unknown,
  context: string,
  devFallback?: () => T
): T {
  const isConnErr = isDbConnectionError(error);
  const isDev = process.env.NODE_ENV !== 'production';

  // Development-only controlled fallback if explicitly provided
  if (isDev && devFallback && isConnErr) {
    console.warn(
      `⚠️ [VibeMiles DB DEV WARNING] PostgreSQL unreachable at localhost:5432 during "${context}".\n` +
      `   Using controlled development fallback. (In production, this throws DatabaseError).`
    );
    return devFallback();
  }

  // Production or non-connection errors: sanitize and log on server
  const rawMessage = error instanceof Error ? error.message : String(error);
  console.error(`❌ [VibeMiles DB SERVER ERROR] [${context}]:`, rawMessage);

  throw new DatabaseError(
    `A database error occurred while processing ${context}. Please try again later.`,
    isConnErr ? 'DB_UNAVAILABLE' : 'QUERY_FAILED'
  );
}
