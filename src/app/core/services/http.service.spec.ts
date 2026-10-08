import { HttpContext } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SILENT_ERRORS } from '@core/interceptors/http-context';
import { HttpService } from './http.service';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('prefixes the base url and sends JSON headers on get', () => {
    let result: unknown;
    service.get('/v1/x').subscribe((r) => (result = r));
    const req = httpMock.expectOne('/api/v1/x');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({ ok: true });
    expect(result).toEqual({ ok: true });
  });

  it('serialises scalar, array and skips undefined query params', () => {
    service.get('/v1/x', { a: 1, b: true, c: ['x', 'y'], d: undefined }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/x');
    expect(req.request.params.get('a')).toBe('1');
    expect(req.request.params.get('b')).toBe('true');
    expect(req.request.params.getAll('c')).toEqual(['x', 'y']);
    expect(req.request.params.has('d')).toBeFalse();
    req.flush({});
  });

  it('retries a failing get once', () => {
    let result: unknown;
    service.get('/v1/x').subscribe((r) => (result = r));
    httpMock.expectOne('/api/v1/x').flush('boom', { status: 500, statusText: 'err' });
    httpMock.expectOne('/api/v1/x').flush({ ok: 1 });
    expect(result).toEqual({ ok: 1 });
  });

  it('propagates the error after the retry is exhausted', () => {
    let status = 0;
    service.get('/v1/x').subscribe({ error: (e) => (status = e.status) });
    httpMock.expectOne('/api/v1/x').flush('boom', { status: 500, statusText: 'err' });
    httpMock.expectOne('/api/v1/x').flush('boom', { status: 500, statusText: 'err' });
    expect(status).toBe(500);
  });

  it('getList returns the list', () => {
    let result: unknown;
    service.getList('/v1/list', { q: 'a' }).subscribe((r) => (result = r));
    httpMock.expectOne((r) => r.url === '/api/v1/list').flush([1, 2]);
    expect(result).toEqual([1, 2]);
  });

  it('getList treats 404 as an empty list', () => {
    let result: unknown;
    service.getList('/v1/list').subscribe((r) => (result = r));
    httpMock.expectOne('/api/v1/list').flush('', { status: 404, statusText: 'nf' });
    httpMock.expectOne('/api/v1/list').flush('', { status: 404, statusText: 'nf' });
    expect(result).toEqual([]);
  });

  it('getList rethrows other errors', () => {
    let status = 0;
    service.getList('/v1/list').subscribe({ error: (e) => (status = e.status) });
    httpMock.expectOne('/api/v1/list').flush('', { status: 500, statusText: 'err' });
    httpMock.expectOne('/api/v1/list').flush('', { status: 500, statusText: 'err' });
    expect(status).toBe(500);
  });

  it('post, put, patch and delete hit the right verb with the body', () => {
    service.post('/v1/p', { a: 1 }).subscribe();
    let req = httpMock.expectOne('/api/v1/p');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ a: 1 });
    req.flush({});

    service.put('/v1/p', { b: 2 }).subscribe();
    req = httpMock.expectOne('/api/v1/p');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ b: 2 });
    req.flush({});

    service.patch('/v1/p', { c: 3 }).subscribe();
    req = httpMock.expectOne('/api/v1/p');
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    service.delete('/v1/p').subscribe();
    req = httpMock.expectOne('/api/v1/p');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('postWithResponse exposes the full response', () => {
    let status = 0;
    service.postWithResponse<{ id: string }>('/v1/p', {}).subscribe((r) => (status = r.status));
    httpMock.expectOne('/api/v1/p').flush({ id: '1' }, { status: 201, statusText: 'Created' });
    expect(status).toBe(201);
  });

  it('getBlob requests a blob and honours the silent flag', () => {
    service.getBlob('/v1/img').subscribe();
    let req = httpMock.expectOne('/api/v1/img');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.get('Accept')).toBe('*/*');
    expect(req.request.context.get(SILENT_ERRORS)).toBeFalse();
    req.flush(new Blob(['x']));

    service.getBlob('/v1/img', true).subscribe();
    req = httpMock.expectOne('/api/v1/img');
    expect(req.request.context.get(SILENT_ERRORS)).toBeTrue();
    req.flush(new Blob(['x']));
  });

  it('postForm sends FormData without forcing a content type', () => {
    const form = new FormData();
    form.append('a', 'b');
    service.postForm('/v1/up', form).subscribe();
    const req = httpMock.expectOne('/api/v1/up');
    expect(req.request.body).toBe(form);
    expect(req.request.headers.has('Content-Type')).toBeFalse();
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({});
  });

  it('postFormForBlob posts FormData and expects a blob', () => {
    const form = new FormData();
    service.postFormForBlob('/v1/doc', form).subscribe();
    const req = httpMock.expectOne('/api/v1/doc');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.body).toBe(form);
    req.flush(new Blob(['d']));
  });

  it('exposes the silent context token default as false', () => {
    expect(new HttpContext().get(SILENT_ERRORS)).toBeFalse();
  });
});
