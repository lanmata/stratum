import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationEditState } from '@core/services/application-edit.state';
import { ApplicationService } from '@core/services/application.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { StorageMockService } from '@core/services/storage-mock.service';
import { ToastService } from '@core/services/toast.service';
import { ApplicationProfileImageComponent } from '@shared/components/application-profile-image/application-profile-image.component';
import { Application } from '@shared/models/application.model';
import { ApplicationFormComponent } from './application-form.component';

@Component({ selector: 'app-application-profile-image', standalone: true, template: 'image' })
class FakeImage {
  applicationId = input.required<string>();
}

const stored: Application = {
  id: 'a1',
  name: 'Alpha',
  description: 'Desc',
  active: false,
  serviceTypeId: 's1',
  createdDate: '2026-01-01 00:00:00',
};

describe('ApplicationFormComponent', () => {
  let service: jasmine.SpyObj<ApplicationService>;
  let serviceTypes: jasmine.SpyObj<ServiceTypeService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;

  function create(id: string | null, editing: Application | null = stored) {
    service = jasmine.createSpyObj('ApplicationService', ['create', 'update']);
    serviceTypes = jasmine.createSpyObj('ServiceTypeService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    serviceTypes.getAll.and.returnValue(
      of([
        { id: 's1', name: 'Premium', active: true },
        { id: 's2', name: 'Retired', active: false },
      ]),
    );
    service.create.and.returnValue(of({ id: 'new', name: 'N', active: true }));
    service.update.and.returnValue(of({ ...stored, name: 'Renamed' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApplicationService, useValue: service },
        { provide: ServiceTypeService, useValue: serviceTypes },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { applicationId: id } : {}) } } },
      ],
    });
    TestBed.overrideComponent(ApplicationFormComponent, {
      remove: { imports: [ApplicationProfileImageComponent] },
      add: { imports: [FakeImage] },
    });
    TestBed.inject(ApplicationEditState).current.set(editing);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ApplicationFormComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  afterEach(() => localStorage.clear());

  it('creates an application with only active service types selectable', () => {
    const dom = create(null);
    expect(dom.text).toContain('Nueva Aplicación');
    expect(dom.qa('select option').map((o) => o.textContent!.trim())).toEqual(['— Seleccionar tipo de servicio —', 'Premium']);
    expect(dom.q('app-application-profile-image')).toBeNull();

    dom.type('input[formControlName=name]', 'Mi app');
    dom.type('textarea[formControlName=description]', 'Desc');
    dom.type('select[formControlName=serviceTypeId]', 's1');
    dom.submit();
    const req = service.create.calls.mostRecent().args[0];
    expect(req.application).toEqual(jasmine.objectContaining({ name: 'Mi app', description: 'Desc', active: true, serviceTypeId: 's1' }));
    expect(req.dateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(toast.info).toHaveBeenCalledWith('Aplicación creada. ID: new', 0, 'new');
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
    expect(JSON.parse(localStorage.getItem('stratum.applications')!)[0].id).toBe('new');
  });

  it('omits an empty description on create', () => {
    const dom = create(null);
    dom.type('input[formControlName=name]', 'Mi app');
    dom.type('select[formControlName=serviceTypeId]', 's1');
    dom.submit();
    expect('description' in service.create.calls.mostRecent().args[0].application).toBeFalse();
  });

  it('does not submit an invalid form and shows validation messages', () => {
    const dom = create(null);
    dom.q('input[formControlName=name]')!.dispatchEvent(new Event('blur'));
    dom.q('select[formControlName=serviceTypeId]')!.dispatchEvent(new Event('blur'));
    dom.fixture.detectChanges();
    expect(dom.text).toContain('El nombre es obligatorio');
    expect(dom.text).toContain('El tipo de servicio es obligatorio');
    dom.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('toggles the active switch', () => {
    const dom = create(null);
    expect(dom.text).toContain('Activa');
    dom.click('button[role=switch]');
    expect(dom.text).toContain('Inactiva');
  });

  it('reports create errors', () => {
    const dom = create(null);
    service.create.and.returnValue(throwError(() => new Error('x')));
    dom.type('input[formControlName=name]', 'Mi app');
    dom.type('select[formControlName=serviceTypeId]', 's1');
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al crear la aplicación');
    expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeFalse();
  });

  it('edits the remembered application, keeping its creation date, and shows the image section', () => {
    const dom = create('a1');
    expect(dom.text).toContain('Editar Aplicación');
    expect(dom.q<HTMLInputElement>('input[formControlName=name]')!.value).toBe('Alpha');
    expect(dom.q('app-application-profile-image')).not.toBeNull();
    dom.type('input[formControlName=name]', 'Renamed');
    dom.submit();
    const [id, req] = service.update.calls.mostRecent().args;
    expect(id).toBe('a1');
    expect(req.application).toEqual(jasmine.objectContaining({ id: 'a1', name: 'Renamed', createdDate: '2026-01-01 00:00:00', active: false }));
    expect(toast.success).toHaveBeenCalledWith('Aplicación actualizada');
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
  });

  it('updates an existing local copy and reports update errors', () => {
    localStorage.setItem('stratum.applications', JSON.stringify([stored]));
    const dom = create('a1');
    dom.submit();
    const list = JSON.parse(localStorage.getItem('stratum.applications')!);
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Renamed');

    localStorage.setItem('stratum.applications', JSON.stringify([{ id: 'other', name: 'o', active: true }]));
    TestBed.resetTestingModule();
    const dom2 = create('a1');
    service.update.and.returnValue(throwError(() => new Error('x')));
    dom2.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al actualizar la aplicación');
  });

  it('prepends the application to the local copy when it was not stored yet', () => {
    localStorage.setItem('stratum.applications', JSON.stringify([{ id: 'other', name: 'o', active: true }]));
    const dom = create('a1');
    dom.submit();
    const list = JSON.parse(localStorage.getItem('stratum.applications')!);
    expect(list.map((a: Application) => a.id)).toEqual(['a1', 'other']);
  });

  it('goes back to the list when there is nothing to edit', () => {
    create('a1', null);
    expect(toast.error).toHaveBeenCalledWith('No se encontraron los datos de la aplicación');
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
    expect(serviceTypes.getAll).not.toHaveBeenCalled();
  });

  it('goes back to the list when the remembered application is a different one', () => {
    create('a1', { ...stored, id: 'zzz' });
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
  });

  it('stops loading when service types cannot be fetched', () => {
    service = jasmine.createSpyObj('ApplicationService', ['create']);
    serviceTypes = jasmine.createSpyObj('ServiceTypeService', ['getAll']);
    serviceTypes.getAll.and.returnValue(throwError(() => new Error('x')));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApplicationService, useValue: service },
        { provide: ServiceTypeService, useValue: serviceTypes },
        { provide: StorageMockService, useValue: { getItem: () => null, setItem: () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationFormComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Cargando tipos de servicio');
  });
});
