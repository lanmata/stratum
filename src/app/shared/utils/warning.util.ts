import { HttpErrorResponse } from '@angular/common/http';

/** Backend explanation carried in the `Warning` header of a rejected request (e.g. 406 on a duplicate), or null. */
export function warningMessage(err: unknown): string | null {
  const header = err instanceof HttpErrorResponse ? err.headers?.get('Warning') : null;
  if (!header) return null;
  const parts = header
    .split(/[;,]/)
    .map((w) => w.trim().replace(/^\d{3}\s+(\S+\s+)?/, '').replace(/^"|"$/g, ''))
    .filter(Boolean);
  return parts.length ? [...new Set(parts)].join('; ') : null;
}
