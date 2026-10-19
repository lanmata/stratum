import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoadingService } from '@core/services/loading.service';
import { StorageMockService } from '@core/services/storage-mock.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { SESSION_TOKEN_HEADER } from '@shared/constants/api.constants';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { SILENT_ERRORS } from './http-context';
import { loadingInterceptor } from './loading.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: jasmine.SpyObj<StorageMockService>;

  beforeEach(() => {
    storage = jasmine.createSpyObj('StorageMockService', ['getItem']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: StorageMockService, useValue: storage },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the session-token header when a token is stored', () => {
    storage.getItem.and.returnValue('tok');
    http.get('/api/v1/users').subscribe();
    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.headers.get(SESSION_TOKEN_HEADER)).toBe('tok');
    req.flush({});
  });

  it('leaves the request alone without a token', () => {
    storage.getItem.and.returnValue(null);
    http.get('/api/v1/users').subscribe();
    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.headers.has(SESSION_TOKEN_HEADER)).toBeFalse();
    req.flush({});
  });

  it('never attaches a token to the login endpoints', () => {
    storage.getItem.and.returnValue('tok');
    http.post('/api/v1/session', {}).subscribe();
    http.post('/api/v1/session/token', {}).subscribe();
    for (const req of httpMock.match(() => true)) {
      expect(req.request.headers.has(SESSION_TOKEN_HEADER)).toBeFalse();
      req.flush({});
    }
  });

  it('does attach it to validate, renew and refresh', () => {
    storage.getItem.and.returnValue('tok');
    http.get('/api/v1/session/validate').subscribe();
    const req = httpMock.expectOne('/api/v1/session/validate');
    expect(req.request.headers.get(SESSION_TOKEN_HEADER)).toBe('tok');
    req.flush(true);
  });
});

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let session: jasmine.SpyObj<SessionStoreService>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    session = jasmine.createSpyObj('SessionStoreService', ['clear']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: SessionStoreService, useValue: session },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function fail(status: number, context?: HttpContext): number {
    let seen = 0;
    http.get('/x', { context }).subscribe({ error: (e) => (seen = e.status) });
    httpMock.expectOne('/x').flush('', { status, statusText: 'err' });
    return seen;
  }

  it('clears the session and redirects to login on 401', () => {
    expect(fail(401)).toBe(401);
    expect(session.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('redirects to forbidden on 403 without touching the session', () => {
    expect(fail(403)).toBe(403);
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
    expect(session.clear).not.toHaveBeenCalled();
  });

  it('rethrows other errors untouched', () => {
    expect(fail(500)).toBe(500);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('lets silent requests fail without redirecting', () => {
    expect(fail(401, new HttpContext().set(SILENT_ERRORS, true))).toBe(401);
    expect(fail(403, new HttpContext().set(SILENT_ERRORS, true))).toBe(403);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(session.clear).not.toHaveBeenCalled();
  });

  it('passes successful responses through', () => {
    let body: unknown;
    http.get('/ok').subscribe((b) => (body = b));
    httpMock.expectOne('/ok').flush({ fine: true });
    expect(body).toEqual({ fine: true });
  });
});

describe('loadingInterceptor', () => {
  it('tracks in-flight requests through LoadingService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(LoadingService);

    http.get('/a').subscribe();
    http.get('/b').subscribe({ error: () => undefined });
    expect(loading.isLoading()).toBeTrue();
    httpMock.expectOne('/a').flush({});
    expect(loading.isLoading()).toBeTrue();
    httpMock.expectOne('/b').flush('', { status: 500, statusText: 'x' });
    expect(loading.isLoading()).toBeFalse();
  });
});
