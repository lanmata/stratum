import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Address, AddressRequest } from '@shared/models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly http = inject(HttpService);

  getByPerson(personId: string): Observable<Address[]> {
    return this.http.get<Address[]>(API.ADDRESSES.BY_PERSON(personId));
  }

  getById(id: string): Observable<Address> {
    return this.http.get<Address>(API.ADDRESSES.BY_ID(id));
  }

  create(req: AddressRequest): Observable<Address> {
    return this.http.post<Address>(API.ADDRESSES.ROOT, req);
  }

  update(id: string, req: AddressRequest): Observable<Address> {
    return this.http.put<Address>(API.ADDRESSES.BY_ID(id), req);
  }

  delete(id: string): Observable<Address> {
    return this.http.delete<Address>(API.ADDRESSES.BY_ID(id));
  }
}
