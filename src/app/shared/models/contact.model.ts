export interface Contact {
  id?: string;
  content: string;
  contactType: ContactType;
  /** Subject = a person. Mutually exclusive with `ownerType` / `ownerId`. */
  personId?: string | null;
  applicationId?: string | null;
  /** Subject = an external owner (e.g. `MERCHANT`) of the application. */
  ownerType?: string | null;
  ownerId?: string | null;
  active: boolean;
}

export interface ContactSearchParams {
  applicationId: string;
  contactTypeId?: string;
  active?: boolean;
  q?: string;
  page?: number;
  size?: number;
}

export interface ContactWriteRequest {
  id?: string;
  content: string;
  contentTypeId: string;
  personId?: string;
  applicationId?: string;
  ownerType?: string;
  ownerId?: string;
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
