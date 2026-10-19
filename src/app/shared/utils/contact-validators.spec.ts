import { FormControl } from '@angular/forms';
import {
  contactContentValidator,
  contactKind,
  documentNumberValidator,
  isValidEmail,
  isValidPhone,
  notBlankValidator,
  zipcodeValidator,
} from './contact-validators';

describe('contact-validators', () => {
  describe('contactKind', () => {
    it('detects email types', () => {
      expect(contactKind('Email')).toBe('email');
      expect(contactKind('Correo electrónico')).toBe('email');
    });
    it('detects phone types', () => {
      expect(contactKind('Teléfono')).toBe('phone');
      expect(contactKind('Mobile')).toBe('phone');
      expect(contactKind('Celular')).toBe('phone');
    });
    it('falls back to other', () => {
      expect(contactKind('Twitter')).toBe('other');
      expect(contactKind(undefined)).toBe('other');
    });
  });

  describe('isValidEmail / isValidPhone', () => {
    it('validates emails', () => {
      expect(isValidEmail('a@b.co')).toBeTrue();
      expect(isValidEmail(' user@example.com ')).toBeTrue();
      expect(isValidEmail('a@b')).toBeFalse();
      expect(isValidEmail('no-at.com')).toBeFalse();
      expect(isValidEmail('a b@c.com')).toBeFalse();
    });
    it('validates phones', () => {
      expect(isValidPhone('+58 412-1234567')).toBeTrue();
      expect(isValidPhone('(021) 555 1234')).toBeFalse();
      expect(isValidPhone('0212 5551234')).toBeTrue();
      expect(isValidPhone('abc')).toBeFalse();
      expect(isValidPhone('123')).toBeFalse();
    });
  });

  describe('contactContentValidator', () => {
    it('ignores empty values', () => {
      const v = contactContentValidator(() => 'Email');
      expect(v(new FormControl(''))).toBeNull();
    });
    it('flags invalid email for email type', () => {
      const v = contactContentValidator(() => 'Email');
      expect(v(new FormControl('nope'))).toEqual({ email: true });
      expect(v(new FormControl('ok@example.com'))).toBeNull();
    });
    it('flags invalid phone for phone type', () => {
      const v = contactContentValidator(() => 'Teléfono');
      expect(v(new FormControl('abc'))).toEqual({ phone: true });
      expect(v(new FormControl('+584121234567'))).toBeNull();
    });
    it('accepts anything for other types', () => {
      const v = contactContentValidator(() => 'Twitter');
      expect(v(new FormControl('@someone'))).toBeNull();
    });
  });

  describe('zipcodeValidator', () => {
    it('accepts empty and valid codes', () => {
      expect(zipcodeValidator(new FormControl(''))).toBeNull();
      expect(zipcodeValidator(new FormControl('1010'))).toBeNull();
      expect(zipcodeValidator(new FormControl('SW1A 1AA'))).toBeNull();
    });
    it('rejects invalid codes', () => {
      expect(zipcodeValidator(new FormControl('#!'))).toEqual({ zipcode: true });
    });
  });

  describe('documentNumberValidator', () => {
    it('accepts empty and valid numbers', () => {
      expect(documentNumberValidator(new FormControl(''))).toBeNull();
      expect(documentNumberValidator(new FormControl('V-12.345.678'))).toBeNull();
    });
    it('rejects invalid numbers', () => {
      expect(documentNumberValidator(new FormControl('12 34'))).toEqual({ documentNumber: true });
      expect(documentNumberValidator(new FormControl('-123'))).toEqual({ documentNumber: true });
    });
  });

  describe('notBlankValidator', () => {
    it('flags whitespace-only values', () => {
      expect(notBlankValidator(new FormControl('   '))).toEqual({ blank: true });
    });
    it('accepts empty (left to required) and non-blank values', () => {
      expect(notBlankValidator(new FormControl(''))).toBeNull();
      expect(notBlankValidator(new FormControl(null))).toBeNull();
      expect(notBlankValidator(new FormControl('x'))).toBeNull();
    });
  });
});
