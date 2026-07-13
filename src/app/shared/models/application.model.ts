export interface Application {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdDate?: string;
  lastUpdate?: string;
  serviceTypeId?: string;
  userList?: string[];
  roleList?: string[];
}

export interface ApplicationCreateRequest {
  application: {
    name: string;
    description?: string;
    active?: boolean;
    serviceTypeId?: string | null;
    createdDate?: string;
    lastUpdate?: string;
  };
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}

export interface ApplicationUpdateRequest {
  application: Application;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}

export type ApplicationCreateResponse = Application;
