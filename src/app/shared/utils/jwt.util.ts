import { UserTO } from '@shared/models/user.model';

export function decodeUserFromToken(token: string): UserTO {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub ?? '',
      alias: payload.alias ?? '',
      email: payload.email ?? '',
      displayName: payload.displayName ?? payload.alias ?? '',
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
