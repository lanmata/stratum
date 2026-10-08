import { of } from 'rxjs';
import { HttpService } from '@core/services/http.service';

export type HttpSpy = jasmine.SpyObj<HttpService>;

export function createHttpSpy(): HttpSpy {
  const spy = jasmine.createSpyObj<HttpService>('HttpService', [
    'get',
    'getList',
    'post',
    'postWithResponse',
    'put',
    'delete',
    'patch',
    'getBlob',
    'postForm',
    'postFormForBlob',
  ]);
  for (const method of Object.values(spy)) {
    (method as jasmine.Spy).and.returnValue(of({}));
  }
  return spy;
}

export function provideHttpSpy(spy: HttpSpy) {
  return { provide: HttpService, useValue: spy };
}
