export interface Feature {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface FeatureRequest {
  feature: {
    id?: string;
    name: string;
    description?: string;
    active: boolean;
  };
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
