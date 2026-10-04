import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,19}$/;
const ZIPCODE_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{1,31}$/;
const DOCUMENT_NUMBER_RE = /^[A-Za-z0-9][A-Za-z0-9\-./]*$/;

export type ContactKind = 'email' | 'phone' | 'other';

export function contactKind(typeName: string | undefined): ContactKind {
  const name = (typeName ?? '').toLowerCase();
  if (/(e-?mail|correo)/.test(name)) return 'email';
  if (/(tel[eé]fono|phone|celular|m[oó]vil|mobile|whatsapp)/.test(name)) return 'phone';
  return 'other';
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function contactContentValidator(typeNameResolver: () => string | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = ((control.value as string) ?? '').trim();
    if (!value) return null;
    const kind = contactKind(typeNameResolver());
    if (kind === 'email' && !isValidEmail(value)) return { email: true };
    if (kind === 'phone' && !isValidPhone(value)) return { phone: true };
    return null;
  };
}

export function zipcodeValidator(control: AbstractControl): ValidationErrors | null {
  const value = ((control.value as string) ?? '').trim();
  if (!value) return null;
  return ZIPCODE_RE.test(value) ? null : { zipcode: true };
}

export function documentNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = ((control.value as string) ?? '').trim();
  if (!value) return null;
  return DOCUMENT_NUMBER_RE.test(value) ? null : { documentNumber: true };
}

export function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  return value && value.length > 0 && value.trim().length === 0 ? { blank: true } : null;
}
