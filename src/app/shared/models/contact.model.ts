export interface Contact {
  id?: string;
  content: string;
  contactType: ContactType;
  personId: string;
  active: boolean;
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
