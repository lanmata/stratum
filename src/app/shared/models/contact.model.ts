export interface Contact {
  id?: string;
  content: string;
  contactType: ContactType;
  personId?: string;
  applicationId?: string;
  ownerType?: string;
  ownerId?: string;
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
