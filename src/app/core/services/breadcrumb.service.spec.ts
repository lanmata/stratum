import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BreadcrumbService } from './breadcrumb.service';

@Component({ standalone: true, template: '' })
class BlankComponent {}

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'dashboard', component: BlankComponent },
          {
            path: 'applications',
            data: { breadcrumb: 'Aplicaciones' },
            children: [
              { path: '', component: BlankComponent },
              { path: 'new', component: BlankComponent, data: { breadcrumb: 'Nueva aplicación' } },
              {
                path: ':applicationId',
                component: BlankComponent,
                data: { breadcrumb: 'Aplicación', breadcrumbKey: 'applicationId' },
                children: [
                  { path: 'users', component: BlankComponent, data: { breadcrumb: 'Usuarios' } },
                ],
              },
            ],
          },
        ]),
      ],
    });
    service = TestBed.inject(BreadcrumbService);
    harness = await RouterTestingHarness.create();
  });

  it('has no crumbs on routes without breadcrumb data', async () => {
    await harness.navigateByUrl('/dashboard');
    expect(service.crumbs()).toEqual([]);
  });

  it('builds a trail with cumulative urls', async () => {
    await harness.navigateByUrl('/applications/new');
    expect(service.crumbs()).toEqual([
      { label: 'Aplicaciones', url: '/applications' },
      { label: 'Nueva aplicación', url: '/applications/new' },
    ]);
  });

  it('uses the static label until a dynamic label is set for the param', async () => {
    await harness.navigateByUrl('/applications/a1/users');
    expect(service.crumbs().map((c) => c.label)).toEqual(['Aplicaciones', 'Aplicación', 'Usuarios']);
    service.setLabel('a1', 'Mi App');
    expect(service.crumbs().map((c) => c.label)).toEqual(['Aplicaciones', 'Mi App', 'Usuarios']);
    expect(service.crumbs()[1].url).toBe('/applications/a1');
  });
});
