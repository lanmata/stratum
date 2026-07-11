import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '@env/environment';

type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

@Injectable({ providedIn: 'root' })
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [key, val] of Object.entries(params)) {
      if (val === undefined) continue;
      if (Array.isArray(val)) {
        val.forEach((v) => (httpParams = httpParams.append(key, v)));
      } else {
        httpParams = httpParams.set(key, String(val));
      }
    }
    return httpParams;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
  }

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http
      .get<T>(`${this.base}${path}`, { headers: this.headers(), params: this.buildParams(params) })
      .pipe(retry(1));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  postWithResponse<T>(path: string, body: unknown): Observable<HttpResponse<T>> {
    return this.http.post<T>(`${this.base}${path}`, body, {
      headers: this.headers(),
      observe: 'response',
    });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }
}
