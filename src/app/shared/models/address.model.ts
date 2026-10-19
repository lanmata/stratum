export interface Address {
  id?: string;
  personId: string;
  content: string;
  zipcode?: string;
}

export interface AddressRequest {
  address: Address;
}
