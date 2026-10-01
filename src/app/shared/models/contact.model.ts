import { Person } from './person.model';

export interface Contact {
  id?: string;
  content: string;
  contactType: ContactType;
  person: Person;
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
