export interface IdentificationDocument {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface IdentificationDocumentRequest {
  identificationDocument: IdentificationDocument;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
