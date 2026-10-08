import { Component, PLATFORM_ID, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { AuthService } from '@core/services/auth.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ProfileImageService } from '@core/services/profile-image.service';
import { StorageMockService } from '@core/services/storage-mock.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { ForbiddenComponent } from '@app/features/forbidden/forbidden.component';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { CommandPaletteComponent } from './command-palette.component';
import { DASHBOARD_ITEM, NAV_GROUPS, NAV_ITEMS, QUICK_ACTIONS } from './nav-items';
import { ShellComponent } from './shell.component';

@Component({ standalone: true, template: 'page' })
class PageComponent {}

describe('nav items', () => {
  it('lists the dashboard first and every group item', () => {
    expect(NAV_ITEMS[0]).toBe(DASHBOARD_ITEM);
    expect(NAV_ITEMS.length).toBe(1 + NAV_GROUPS.reduce((n, g) => n + g.items.length, 0));
    const paths = NAV_ITEMS.map((i) => i.path);
    for (const p of ['/applications', '/people', '/contacts', '/features', '/audit', '/iam', '/reports']) {
      expect(paths).toContain(p);
    }
    expect(new Set(paths).size).toBe(paths.length);
    expect(QUICK_ACTIONS.every((a) => a.path.endsWith('/new'))).toBeTrue();
  });
});

describe('ForbiddenComponent', () => {
  it('links back to the dashboard', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ForbiddenComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    expect(dom.text).toContain('Acceso denegado');
    expect(dom.q('a')!.getAttribute('href')).toBe('/dashboard');
  });
});

describe('BreadcrumbsComponent', () => {
  it('renders the home link and the crumbs, marking the last as current', () => {
    const crumbs = signal([
      { label: 'Aplicaciones', url: '/applications' },
      { label: 'Detalle', url: '/applications/1' },
    ]);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: BreadcrumbService, useValue: { crumbs } }],
    });
    const fixture = TestBed.createComponent(BreadcrumbsComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    expect(dom.q('a[href="/dashboard"]')).not.toBeNull();
    expect(dom.q('a[href="/applications"]')!.textContent).toContain('Aplicaciones');
    expect(dom.q('[aria-current=page]')!.textContent).toContain('Detalle');
    crumbs.set([]);
    fixture.detectChanges();
    expect(dom.q('[aria-current=page]')).toBeNull();
  });
});

describe('CommandPaletteComponent', () => {
  let router: jasmine.SpyObj<Router>;

  function create() {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
    const fixture = TestBed.createComponent(CommandPaletteComponent);
    let closed = 0;
    fixture.componentInstance.closed.subscribe(() => closed++);
    fixture.detectChanges();
    return { fixture, dom: new Dom(fixture), closed: () => closed };
  }

  const key = (dom: Dom<CommandPaletteComponent>, k: string) => {
    dom.q('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true }));
    dom.fixture.detectChanges();
  };

  it('lists navigation and creation entries and focuses the input', async () => {
    const { fixture, dom } = create();
    await fixture.whenStable();
    expect(dom.qa('[role=option]').length).toBeGreaterThan(5);
    expect(dom.text).toContain('Ir a');
    expect(dom.text).toContain('Crear');
  });

  it('filters ignoring accents and case, and shows an empty state', () => {
    const { dom } = create();
    dom.type('input', 'AUDITORIA');
    expect(dom.qa('[role=option]').length).toBe(1);
    dom.type('input', 'zzzz');
    expect(dom.qa('[role=option]').length).toBe(0);
    expect(dom.text).toContain('Sin resultados');
    key(dom, 'ArrowDown');
    key(dom, 'Enter');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('moves the selection with arrow keys, wrapping around', () => {
    const { dom } = create();
    dom.type('input', 'tipos');
    const count = dom.qa('[role=option]').length;
    expect(dom.qa('[role=option]')[0].getAttribute('aria-selected')).toBe('true');
    key(dom, 'ArrowUp');
    expect(dom.qa('[role=option]')[count - 1].getAttribute('aria-selected')).toBe('true');
    key(dom, 'ArrowDown');
    expect(dom.qa('[role=option]')[0].getAttribute('aria-selected')).toBe('true');
  });

  it('navigates to the active entry on Enter and closes', () => {
    const { dom, closed } = create();
    dom.type('input', 'features');
    key(dom, 'Enter');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/features');
    expect(closed()).toBe(1);
  });

  it('navigates on click and highlights on hover', () => {
    const { dom, closed } = create();
    const options = dom.qa('[role=option]');
    options[2].dispatchEvent(new Event('mouseenter'));
    dom.fixture.detectChanges();
    expect(dom.qa('[role=option]')[2].getAttribute('aria-selected')).toBe('true');
    dom.click(options[2]);
    expect(router.navigateByUrl).toHaveBeenCalled();
    expect(closed()).toBe(1);
  });

  it('closes on backdrop click but not on dialog click', () => {
    const { dom, closed } = create();
    dom.click('[role=dialog]');
    expect(closed()).toBe(0);
    dom.click('.fixed');
    expect(closed()).toBe(1);
  });

  it('ignores unrelated keys', () => {
    const { dom } = create();
    key(dom, 'a');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('ShellComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let profile: jasmine.SpyObj<ProfileImageService>;
  let user$: Subject<unknown>;
  let storage: Record<string, string>;

  async function create(platform = 'browser') {
    auth = jasmine.createSpyObj('AuthService', ['logout']);
    profile = jasmine.createSpyObj('ProfileImageService', ['getImage']);
    profile.getImage.and.returnValue(throwError(() => ({ status: 404 })));
    user$ = new Subject();
    storage = {};
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'dashboard', component: PageComponent },
          { path: 'applications', component: PageComponent, data: { breadcrumb: 'Aplicaciones' } },
        ]),
        { provide: AuthService, useValue: auth },
        { provide: ProfileImageService, useValue: profile },
        { provide: SessionStoreService, useValue: { user$ } },
        { provide: PLATFORM_ID, useValue: platform },
        {
          provide: StorageMockService,
          useValue: {
            getItem: (k: string) => storage[k] ?? null,
            setItem: (k: string, v: string) => (storage[k] = v),
          },
        },
      ],
    });
  }

  const build = () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    return { fixture, dom: new Dom(fixture) };
  };

  it('renders navigation groups and the initials of the user', async () => {
    await create();
    const { fixture, dom } = build();
    user$.next({ alias: 'ana maria perez' });
    fixture.detectChanges();
    expect(dom.text).toContain('Gestión');
    expect(dom.text).toContain('Herramientas');
    expect(dom.q('a[href="/iam"]')).not.toBeNull();
    expect(dom.text).toContain('AM');
  });

  it('falls back to display name and then to a generic label', async () => {
    await create();
    const { fixture, dom } = build();
    user$.next({ alias: '', displayName: 'Zoe Z' });
    fixture.detectChanges();
    expect(dom.text).toContain('ZZ');
    user$.next({});
    fixture.detectChanges();
    expect(dom.text).toContain('Usuario');
  });

  it('shows the profile image when one exists', async () => {
    await create();
    profile.getImage.and.returnValue(of(new Blob(['png'], { type: 'image/png' })));
    const { dom } = build();
    const img = dom.q<HTMLImageElement>('header img');
    expect(img).not.toBeNull();
    expect(img!.src).toContain('blob:');
  });

  it('ignores empty images and does not load them on the server', async () => {
    await create();
    profile.getImage.and.returnValue(of(new Blob([])));
    expect(build().dom.q('header img')).toBeNull();

    TestBed.resetTestingModule();
    await create('server');
    build();
    expect(profile.getImage).not.toHaveBeenCalled();
  });

  it('revokes the object url when destroyed', async () => {
    await create();
    profile.getImage.and.returnValue(of(new Blob(['png'])));
    const revoke = spyOn(URL, 'revokeObjectURL');
    const { fixture } = build();
    fixture.destroy();
    expect(revoke).toHaveBeenCalled();
  });

  it('collapses the sidebar and remembers the choice', async () => {
    await create();
    const { dom } = build();
    dom.click('button[aria-label="Contraer menú"]');
    expect(storage['sidebar-collapsed']).toBe('true');
    expect(dom.text).not.toContain('Contraer');
    dom.click('button[aria-label="Expandir menú"]');
    expect(storage['sidebar-collapsed']).toBe('false');
  });

  it('starts collapsed when stored', async () => {
    await create();
    TestBed.resetTestingModule();
    await create();
    storage['sidebar-collapsed'] = 'true';
    const { dom } = build();
    expect(dom.q('button[aria-label="Expandir menú"]')).not.toBeNull();
  });

  it('toggles the theme', async () => {
    await create();
    const { dom } = build();
    dom.click('button[aria-label="Cambiar a modo oscuro"]');
    expect(dom.q('button[aria-label="Cambiar a modo claro"]')).not.toBeNull();
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
  });

  it('opens the user menu, logs out and closes on outside click or Escape', async () => {
    await create();
    const { fixture, dom } = build();
    dom.click('button[aria-haspopup=menu]');
    expect(dom.q('[role=menu]')).not.toBeNull();
    document.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(dom.q('[role=menu]')).toBeNull();

    dom.click('button[aria-haspopup=menu]');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(dom.q('[role=menu]')).toBeNull();

    dom.click('button[aria-haspopup=menu]');
    dom.clickByText('[role=menuitem]', 'Cerrar sesión');
    expect(auth.logout).toHaveBeenCalled();
  });

  it('opens the mobile menu and closes it from the backdrop and close button', async () => {
    await create();
    const { fixture, dom } = build();
    dom.click('button[aria-label="Abrir menú"]');
    expect(dom.q('.backdrop-blur-sm.fixed')).not.toBeNull();
    dom.click('.backdrop-blur-sm.fixed');
    expect(dom.q('.backdrop-blur-sm.fixed')).toBeNull();
    dom.click('button[aria-label="Abrir menú"]');
    dom.click('button[aria-label="Cerrar menú"]');
    expect(fixture.nativeElement.querySelector('.backdrop-blur-sm.fixed')).toBeNull();
  });

  it('opens the command palette with the button and Ctrl+K, closing it with Ctrl+K', async () => {
    await create();
    const { fixture, dom } = build();
    dom.click('button[aria-label="Búsqueda rápida"]');
    expect(dom.q('app-command-palette')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges();
    expect(dom.q('app-command-palette')).toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', metaKey: true }));
    fixture.detectChanges();
    expect(dom.q('app-command-palette')).not.toBeNull();
  });

  it('closes menus on navigation and updates the document title', fakeAsync(async () => {
    await create();
    const harness = await RouterTestingHarness.create();
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    dom.click('button[aria-haspopup=menu]');
    await harness.navigateByUrl('/applications');
    tick();
    fixture.detectChanges();
    expect(dom.q('[role=menu]')).toBeNull();
    expect(document.title).toContain('Aplicaciones');
    expect(TestBed.inject(BreadcrumbService).crumbs().length).toBe(1);
  }));
});
