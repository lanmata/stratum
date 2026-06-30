export interface Application {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ApplicationCreateRequest {
  application: Application;
}
