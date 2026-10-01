// 0 = Pasaporte, 1 = Cédula/Documento de identificación (enum entero del backend)
export const IDENTIFICATION_TYPE_PASSPORT = 0;
export const IDENTIFICATION_TYPE_IDENTIFICATION = 1;

export interface IdentificationDocument {
  id?: string;
  number: string;
  expirationDate?: string;
  identificationType: number;
  personId: string;
}

export interface IdentificationDocumentRequest {
  identificationDocument: IdentificationDocument;
}
