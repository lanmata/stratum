export interface Address {
  id: string;
  personId: string;
  address: string;
  zipcode?: string;
}

export interface AddressRequest {
  address: Address;
  dateTime?: string;
  appName?: string;
  appToken?: string | null;
}
