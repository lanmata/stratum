import { Feature } from './feature.model';

export interface Role {
  id: string;
  name: string;
  description?: string;
  features?: Feature[];
  active: boolean;
}

export interface RoleRequest {
  role: {
    id?: string;
    name: string;
    description?: string;
    features?: Array<{ id?: string; name: string; description?: string; active: boolean }>;
    active: boolean;
  };
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
