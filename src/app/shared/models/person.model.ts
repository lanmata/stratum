export interface Person {
  id?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  birthdate?: string;
}

export interface PersonRequest {
  person: Person;
}
