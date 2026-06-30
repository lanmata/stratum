export interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface RoleRequest {
  role: Role;
}
