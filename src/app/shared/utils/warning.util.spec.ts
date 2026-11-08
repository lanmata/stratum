import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { featureConflictMessage, warningMessage } from './warning.util';

const err = (warning?: string, status = 406) =>
  new HttpErrorResponse({ status, headers: new HttpHeaders(warning ? { Warning: warning } : {}) });

describe('warningMessage', () => {
  it('returns the Warning header text', () => {
    expect(warningMessage(err('Feature already exists'))).toBe('Feature already exists');
  });
  it('strips the RFC 7234 code/agent prefix and quotes, and de-duplicates', () => {
    expect(warningMessage(err('199 backbone "Duplicate"; Duplicate'))).toBe('Duplicate');
  });
  it('returns null without header or for non-HTTP errors', () => {
    expect(warningMessage(err())).toBeNull();
    expect(warningMessage(new Error('x'))).toBeNull();
  });
});

describe('featureConflictMessage', () => {
  it('prefers the Warning header', () => {
    expect(featureConflictMessage(err('Feature already exists'))).toBe('Feature already exists');
  });
  it('falls back to a fixed text on a bare 406 or 409', () => {
    expect(featureConflictMessage(err())).toContain('ya existe');
    expect(featureConflictMessage(err(undefined, 409))).toContain('ya existe');
  });
  it('returns null for other errors', () => {
    expect(featureConflictMessage(err(undefined, 500))).toBeNull();
    expect(featureConflictMessage(new Error('x'))).toBeNull();
  });
});
