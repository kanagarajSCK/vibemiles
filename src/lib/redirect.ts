import { ROUTES } from '@/constants';

/**
 * Validates that a path is a safe relative internal application route.
 * Rejects:
 * - External schemes (http:, https:, javascript:, data:)
 * - Protocol-relative URLs (//evil.com)
 * - Backslashes (/\evil.com, \evil.com)
 * - Control characters
 */
export function isValidInternalPath(path?: string | null): boolean {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  return (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('\\') &&
    !trimmed.includes(':') &&
    !trimmed.startsWith('/\\')
  );
}

/**
 * Sanitizes the 'next' redirect query parameter.
 * Returns the validated internal path, or falls back to the default dashboard route.
 */
export function sanitizeRedirectPath(
  nextPath?: string | null,
  fallback: string = ROUTES.ACCOUNT_DASHBOARD
): string {
  if (!nextPath || typeof nextPath !== 'string') return fallback;
  const trimmed = nextPath.trim();
  if (isValidInternalPath(trimmed)) {
    return trimmed;
  }
  return fallback;
}
