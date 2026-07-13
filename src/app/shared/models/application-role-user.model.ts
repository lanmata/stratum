export interface ApplicationRoleUser {
  id: string;
  applicationId: string;
  roleId: string;
  userId: string;
  active: boolean;
  profileImageRef?: string;
}

export interface ApplicationRoleUserRequest {
  applicationRoleUser: ApplicationRoleUser;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
