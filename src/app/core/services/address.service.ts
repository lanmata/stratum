import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Address, AddressRequest } from '@shared/models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly http = inject(HttpService);

  getById(addressId: string): Observable<Address> {
    return this.http.get<Address>(API.ADDRESSES.BY_ID(addressId));
  }

  getByPerson(personId: string): Observable<Address[]> {
    return this.http.getList<Address>(API.ADDRESSES.BY_PERSON(personId));
  }

  create(req: AddressRequest): Observable<Address> {
    return this.http.post<Address>(API.ADDRESSES.ROOT, req);
  }

  update(addressId: string, req: AddressRequest): Observable<Address> {
    return this.http.put<Address>(API.ADDRESSES.BY_ID(addressId), req);
  }

  delete(addressId: string): Observable<Address> {
    return this.http.delete<Address>(API.ADDRESSES.BY_ID(addressId));
  }
}
