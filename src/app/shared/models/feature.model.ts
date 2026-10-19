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

/** Lightweight catalog row returned by `GET /features/` (no role links). */
export interface FeatureSummary {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface FeatureSearchParams {
  q?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

/** A role (and the application that owns it) a feature is linked to. */
export interface FeatureRoleLink {
  roleId: string;
  roleName: string;
  roleActive: boolean;
  applicationId: string;
  applicationName: string;
}
