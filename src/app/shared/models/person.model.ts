import { Contact } from './user.model';

export interface Person {
  id?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  birthdate?: string;
  contacts?: Contact[];
}

export interface PersonRequest {
  person: Person;
}
