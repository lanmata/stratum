/** Un proveedor que Stratum ofrece en la pantalla de acceso. */
export interface FederationProvider {
  provider: string;
  displayName: string;
}

/** Ajuste de un proveedor de identidad para una aplicación. Nunca lleva el secreto, solo la referencia a él. */
export interface IdentityProvider {
  id: string;
  applicationId: string;
  provider: string;
  providerType: string;
  clientId: string;
  clientSecretRef: string;
  issuer?: string | null;
  scopes?: string | null;
  redirectUris: string[];
  allowedEmailDomains: string[];
  trustedEmail: boolean;
  enabled: boolean;
  createdDate?: string;
  lastUpdate?: string;
}

export interface IdentityProviderRequest {
  applicationId: string;
  provider: string;
  clientId: string;
  clientSecretRef: string;
  issuer?: string | null;
  scopes?: string | null;
  redirectUris: string[];
  allowedEmailDomains: string[];
  trustedEmail?: boolean;
  enabled?: boolean;
}

/** Una cuenta externa enlazada a un usuario. */
export interface LinkedIdentity {
  id: string;
  provider: string;
  email?: string | null;
  displayName?: string | null;
  linkedAt?: string | null;
  lastLoginAt?: string | null;
}

/** Los proveedores que Backbone sabe usar. */
export const FEDERATION_PROVIDER_NAMES = ['google', 'microsoft', 'apple', 'github', 'meta'] as const;

/** Mensajes de los códigos que el BFF deja en `/auth/login?error=`. Ninguno repite texto del proveedor. */
export const FEDERATION_MESSAGES: Readonly<Record<string, string>> = {
  denied: 'Cancelaste el inicio de sesión con el proveedor.',
  expired: 'El inicio de sesión expiró o no es válido. Inténtalo de nuevo.',
  failed: 'No pudimos verificar tu cuenta con el proveedor.',
  not_registered: 'Tu cuenta no está registrada en esta aplicación. Pide acceso a un administrador.',
  not_allowed: 'Esta cuenta no tiene permiso para entrar.',
  not_linked: 'Esta cuenta aún no está enlazada: entra con tu contraseña y enlázala.',
  conflict: 'Esa cuenta ya está enlazada a otro usuario.',
  unavailable: 'El servicio no está disponible. Inténtalo de nuevo en unos minutos.',
  rate_limited: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.',
};

/** El mensaje del código, el de «falló» si no se conoce, o `null` si no hay código. */
export function federationMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return FEDERATION_MESSAGES[code] ?? FEDERATION_MESSAGES['failed'];
}
