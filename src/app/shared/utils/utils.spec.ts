import { downloadBlob } from './download.util';
import { parseIds } from './ids.util';
import { getTokenExpiry } from './jwt.util';

function tokenWith(payload: object): string {
  return `h.${btoa(JSON.stringify(payload))}.s`;
}

describe('parseIds', () => {
  it('splits on commas, whitespace and semicolons, trimming and deduplicating', () => {
    expect(parseIds(' a, b ;c\n d,a ,, ')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns an empty list for blank input', () => {
    expect(parseIds('  ,  ')).toEqual([]);
    expect(parseIds('')).toEqual([]);
  });
});

describe('getTokenExpiry', () => {
  it('returns the exp claim in milliseconds', () => {
    expect(getTokenExpiry(tokenWith({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it('returns null when there is no numeric exp', () => {
    expect(getTokenExpiry(tokenWith({ sub: 'x' }))).toBeNull();
    expect(getTokenExpiry(tokenWith({ exp: 'soon' }))).toBeNull();
  });

  it('returns null for malformed tokens', () => {
    expect(getTokenExpiry('garbage')).toBeNull();
    expect(getTokenExpiry('a.!!!.c')).toBeNull();
  });
});

describe('downloadBlob', () => {
  it('clicks a temporary anchor with the file name and revokes the url', () => {
    const anchor = document.createElement('a');
    const click = spyOn(anchor, 'click');
    spyOn(document, 'createElement').and.returnValue(anchor);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:fake');
    const revoke = spyOn(URL, 'revokeObjectURL');

    downloadBlob(new Blob(['x']), 'file.txt');

    expect(anchor.download).toBe('file.txt');
    expect(anchor.href).toContain('blob:fake');
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:fake');
  });
});
