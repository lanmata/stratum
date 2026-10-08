import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApplicationDirectoryService } from './application-directory.service';
import { ApplicationEditState } from './application-edit.state';
import { ApplicationService } from './application.service';
import { LoadingService } from './loading.service';
import { StorageMockService } from './storage-mock.service';
import { ThemeService } from './theme.service';
import { ToastService } from './toast.service';
import { Application } from '@shared/models/application.model';

const app = (id: string, name = id): Application => ({ id, name, active: true });

describe('LoadingService', () => {
  it('stays loading until every request finished', () => {
    const svc = TestBed.inject(LoadingService);
    expect(svc.isLoading()).toBeFalse();
    svc.start();
    svc.start();
    expect(svc.isLoading()).toBeTrue();
    svc.stop();
    expect(svc.isLoading()).toBeTrue();
    svc.stop();
    expect(svc.isLoading()).toBeFalse();
  });

  it('never goes below zero', () => {
    const svc = TestBed.inject(LoadingService);
    svc.stop();
    svc.start();
    expect(svc.isLoading()).toBeTrue();
    svc.stop();
    expect(svc.isLoading()).toBeFalse();
  });
});

describe('StorageMockService', () => {
  afterEach(() => localStorage.clear());

  it('delegates to localStorage in the browser', () => {
    const svc = TestBed.inject(StorageMockService);
    svc.setItem('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
    expect(svc.getItem('k')).toBe('v');
    svc.removeItem('k');
    expect(svc.getItem('k')).toBeNull();
    svc.setItem('a', '1');
    svc.clear();
    expect(localStorage.length).toBe(0);
  });

  describe('on the server', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    });

    it('keeps values in memory without touching localStorage', () => {
      const svc = TestBed.inject(StorageMockService);
      svc.setItem('k', 'v');
      expect(localStorage.getItem('k')).toBeNull();
      expect(svc.getItem('k')).toBe('v');
      expect(svc.getItem('missing')).toBeNull();
      svc.removeItem('k');
      expect(svc.getItem('k')).toBeNull();
      svc.setItem('a', '1');
      svc.clear();
      expect(svc.getItem('a')).toBeNull();
    });
  });
});

describe('ThemeService', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('uses the stored preference', () => {
    localStorage.setItem('theme', 'dark');
    const svc = TestBed.inject(ThemeService);
    svc.init();
    expect(svc.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('falls back to the system preference', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const svc = TestBed.inject(ThemeService);
    svc.init();
    expect(svc.isDark()).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles and persists', () => {
    localStorage.setItem('theme', 'light');
    const svc = TestBed.inject(ThemeService);
    svc.init();
    expect(svc.isDark()).toBeFalse();
    svc.toggle();
    expect(svc.isDark()).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
    svc.toggle();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('does not touch the DOM on the server', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const svc = TestBed.inject(ThemeService);
    svc.init();
    expect(svc.isDark()).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });
});

describe('ToastService', () => {
  it('adds typed toasts and auto-dismisses them', fakeAsync(() => {
    const svc = TestBed.inject(ToastService);
    svc.success('ok');
    svc.error('bad');
    svc.warning('careful');
    svc.info('fyi', 4000, 'copy-me');
    expect(svc.toasts().map((t) => t.type)).toEqual(['success', 'error', 'warning', 'info']);
    expect(svc.toasts()[3].copyValue).toBe('copy-me');
    tick(4000);
    expect(svc.toasts().map((t) => t.type)).toEqual(['error', 'warning']);
    tick(2000);
    expect(svc.toasts().map((t) => t.type)).toEqual(['error']);
    tick(2000);
    expect(svc.toasts()).toEqual([]);
  }));

  it('keeps sticky toasts (duration 0) until dismissed manually', fakeAsync(() => {
    const svc = TestBed.inject(ToastService);
    svc.info('sticky', 0);
    tick(60_000);
    expect(svc.toasts().length).toBe(1);
    svc.dismiss(svc.toasts()[0].id);
    expect(svc.toasts()).toEqual([]);
  }));
});

describe('ApplicationEditState', () => {
  it('holds the application being edited', () => {
    const state = TestBed.inject(ApplicationEditState);
    expect(state.current()).toBeNull();
    state.current.set(app('1'));
    expect(state.current()?.id).toBe('1');
  });
});

describe('ApplicationDirectoryService', () => {
  let api: jasmine.SpyObj<ApplicationService>;
  let directory: ApplicationDirectoryService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApplicationService', ['getById']);
    TestBed.configureTestingModule({ providers: [{ provide: ApplicationService, useValue: api }] });
    directory = TestBed.inject(ApplicationDirectoryService);
  });

  it('stores and upserts applications', () => {
    directory.setAll([app('1'), app('2')]);
    directory.upsert(app('1', 'renamed'));
    expect(directory.all().map((a) => a.name)).toEqual(['2', 'renamed']);
  });

  it('resolves from the cache without calling the API', () => {
    directory.setAll([app('1')]);
    let result: Application | undefined;
    directory.resolve('1').subscribe((a) => (result = a));
    expect(result?.id).toBe('1');
    expect(api.getById).not.toHaveBeenCalled();
  });

  it('fetches and caches unknown applications', () => {
    api.getById.and.returnValue(of(app('9')));
    let result: Application | undefined;
    directory.resolve('9').subscribe((a) => (result = a));
    expect(result?.id).toBe('9');
    expect(directory.all().some((a) => a.id === '9')).toBeTrue();
  });

  it('resolves undefined when the API fails', () => {
    api.getById.and.returnValue(throwError(() => new Error('x')));
    let result: Application | undefined = app('x');
    directory.resolve('9').subscribe((a) => (result = a));
    expect(result).toBeUndefined();
  });
});
