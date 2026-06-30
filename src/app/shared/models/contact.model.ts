export interface Contact {
  id?: string;
  value: string;
  contactTypeId: string;
  personId?: string;
}

export interface ContactType {
  id: string;
  name: string;
  active: boolean;
}
