export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ServiceTypeRequest {
  serviceType: ServiceType;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
