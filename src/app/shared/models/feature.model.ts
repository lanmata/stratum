export interface Feature {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  roleIds?: string[];
}

export interface FeatureRequest {
  feature: {
    id?: string;
    name: string;
    description?: string;
    active: boolean;
    roleIds?: string[];
  };
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
