import { UserTO } from '@shared/models/user.model';

export function decodeUserFromToken(token: string): UserTO {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub ?? '',
      alias: payload.alias ?? payload.preferred_username ?? payload.username ?? '',
      email: payload.email ?? '',
      displayName: payload.displayName ?? payload.name ?? payload.alias ?? payload.preferred_username ?? '',
      active: true,
      notificationEmail: false,
      notificationSms: false,
      privacyDataOutActive: false,
      roles: payload.roles ?? [],
    };
  } catch {
    return {
      id: '',
      alias: '',
      email: '',
      displayName: '',
      active: true,
      notificationEmail: false,
      notificationSms: false,
      privacyDataOutActive: false,
    };
  }
}

export function getTokenExpiry(token: string): number | null {
  try {
    const exp = JSON.parse(atob(token.split('.')[1])).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
