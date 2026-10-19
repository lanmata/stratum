import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationDirectoryService } from '@core/services/application-directory.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { ToastService } from '@core/services/toast.service';
import { ApplicationDetailComponent } from './application-detail.component';

describe('ApplicationDetailComponent', () => {
  let directory: jasmine.SpyObj<ApplicationDirectoryService>;
  let serviceTypes: jasmine.SpyObj<ServiceTypeService>;
  let toast: jasmine.SpyObj<ToastService>;
  let breadcrumbs: jasmine.SpyObj<BreadcrumbService>;
  let router: Router;

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApplicationDirectoryService, useValue: directory },
        { provide: ServiceTypeService, useValue: serviceTypes },
        { provide: ToastService, useValue: toast },
        { provide: BreadcrumbService, useValue: breadcrumbs },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ApplicationDetailComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  beforeEach(() => {
    directory = jasmine.createSpyObj('ApplicationDirectoryService', ['resolve']);
    serviceTypes = jasmine.createSpyObj('ServiceTypeService', ['getById']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    breadcrumbs = jasmine.createSpyObj('BreadcrumbService', ['setLabel']);
    serviceTypes.getById.and.returnValue(of({ id: 's1', name: 'Premium', active: true }));
  });

  it('shows the application header, tabs and service type', () => {
    directory.resolve.and.returnValue(of({ id: 'a1', name: 'Alpha', description: 'Desc', active: true, serviceTypeId: 's1' }));
    const dom = create();
    expect(dom.text).toContain('Alpha');
    expect(dom.text).toContain('Desc');
    expect(dom.text).toContain('Activa');
    expect(dom.text).toContain('Premium');
    expect(dom.qa('nav a').map((a) => a.textContent!.trim())).toEqual(['Usuarios', 'Roles', 'Clientes M2M', 'Avisos']);
    expect(breadcrumbs.setLabel).toHaveBeenCalledWith('a1', 'Alpha');
    expect(dom.q('a[href="/applications/a1/edit"]')).not.toBeNull();
  });

  it('shows inactive apps without description or service type', () => {
    directory.resolve.and.returnValue(of({ id: 'a1', name: 'Alpha', active: false }));
    const dom = create();
    expect(dom.text).toContain('Inactiva');
    expect(serviceTypes.getById).not.toHaveBeenCalled();
    expect(dom.text).toContain('Tipo de servicio: —');
  });

  it('survives a failing service type lookup', () => {
    directory.resolve.and.returnValue(of({ id: 'a1', name: 'Alpha', active: true, serviceTypeId: 's1' }));
    serviceTypes.getById.and.returnValue(throwError(() => new Error('x')));
    const dom = create();
    expect(dom.text).toContain('Tipo de servicio: —');
  });

  it('goes back to the list when the application does not exist', () => {
    directory.resolve.and.returnValue(of(undefined));
    create();
    expect(toast.error).toHaveBeenCalledWith('No se encontró la aplicación solicitada');
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
  });

  it('goes back to the list when loading fails', () => {
    directory.resolve.and.returnValue(throwError(() => new Error('x')));
    create();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar la aplicación');
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
  });
});
