export interface Feature {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface FeatureRequest {
  feature: Feature;
}
