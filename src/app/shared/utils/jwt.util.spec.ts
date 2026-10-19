import { decodeUserFromToken } from './jwt.util';

const tokenWith = (payload: object) => `h.${btoa(JSON.stringify(payload))}.s`;

describe('decodeUserFromToken', () => {
  it('reads the alias claim', () => {
    expect(decodeUserFromToken(tokenWith({ alias: 'lmata' })).alias).toBe('lmata');
  });

  it('falls back to preferred_username / username', () => {
    expect(decodeUserFromToken(tokenWith({ preferred_username: 'pu' })).alias).toBe('pu');
    expect(decodeUserFromToken(tokenWith({ username: 'un' })).alias).toBe('un');
  });

  it('returns an empty alias when the token has none or is malformed', () => {
    expect(decodeUserFromToken(tokenWith({ sub: '1' })).alias).toBe('');
    expect(decodeUserFromToken('garbage').alias).toBe('');
  });
});
