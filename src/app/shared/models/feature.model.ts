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

export interface FeatureSummary {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface FeatureRoleLink {
  roleId: string;
  roleName: string;
  roleActive: boolean;
  applicationId: string;
  applicationName: string;
}

export interface FeatureSearchParams {
  q?: string;
  active?: boolean;
  page?: number;
  size?: number;
}
