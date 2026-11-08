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

const FEATURE_EXISTS =
  'La funcionalidad ya existe: búscala en el catálogo y agrégala en lugar de crearla de nuevo.';

/** Backend reason, or a fixed text when it rejects a duplicate feature (406/409) without a Warning header. */
export function featureConflictMessage(err: unknown): string | null {
  const reason = warningMessage(err);
  if (reason) return reason;
  const duplicate = err instanceof HttpErrorResponse && (err.status === 406 || err.status === 409);
  return duplicate ? FEATURE_EXISTS : null;
}
