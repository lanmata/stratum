import { Person } from './person.model';
import { Role } from './role.model';
import { Application } from './application.model';

export interface UserTO {
  id: string;
  alias: string;
  password?: string;
  email: string;
  displayName: string;
  createdDate?: string;
  lastUpdate?: string;
  active: boolean;
  notificationEmail: boolean;
  notificationSms: boolean;
  privacyDataOutActive: boolean;
  person?: Person;
  roles?: Role[];
  applications?: Application[];
}

export interface UserCreateRequest {
  id?: string;
  alias: string;
  displayName: string;
  password: string;
  email: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  privacyDataOutActive: boolean;
  active: boolean;
  person?: Person;
  roleId: string;
  applicationId: string;
}

export interface UserCreateResponse {
  id: string;
  alias: string;
  email: string;
}

export interface PutUserUpdateRequest {
  userId: string;
  password?: string;
  displayName?: string;
  active?: boolean;
  notificationEmail?: boolean;
  notificationSms?: boolean;
  privacyDataOutActive?: boolean;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: string;
  birthdate?: string;
  contacts?: Contact[];
  roleIds?: string[];
  application?: string;
}

export interface UserAliasTO {
  alias: string;
  applicationId: string;
}

export interface Contact {
  id?: string;
  value: string;
  contactTypeId: string;
}
