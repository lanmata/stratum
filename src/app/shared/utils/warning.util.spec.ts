import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { warningMessage } from './warning.util';

const err = (warning?: string) =>
  new HttpErrorResponse({ status: 406, headers: new HttpHeaders(warning ? { Warning: warning } : {}) });

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
