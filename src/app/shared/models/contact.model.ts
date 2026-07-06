export interface Contact {
  id?: string;
  value: string;
  contactTypeId: string;
  personId?: string;
}

export interface ContactType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ContactTypeRequest {
  contactType: ContactType;
  dateTime?: string;
  appName?: string;
  appToken?: string;
}
