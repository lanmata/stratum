export interface RoleFeature {
  id: string;
  roleId: string;
  featureId: string;
  active: boolean;
}

export interface RoleFeatureRequest {
  roleFeature: RoleFeature;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
