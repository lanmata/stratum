import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Person, PersonRequest } from '@shared/models/person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpService);

  getAll(): Observable<Person[]> {
    return this.http.get<Person[]>(API.PEOPLE.ROOT);
  }

  getById(personId: string): Observable<Person> {
    return this.http.get<Person>(API.PEOPLE.BY_ID(personId));
  }

  create(req: PersonRequest): Observable<Person> {
    return this.http.post<Person>(`${API.PEOPLE.ROOT}/`, req);
  }

  update(personId: string, req: PersonRequest): Observable<Person> {
    return this.http.put<Person>(API.PEOPLE.BY_ID(personId), req);
  }
}
