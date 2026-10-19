import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationDirectoryService } from '@core/services/application-directory.service';
import { ApplicationEditState } from '@core/services/application-edit.state';
import { ApplicationService } from '@core/services/application.service';
import { ToastService } from '@core/services/toast.service';
import { Application } from '@shared/models/application.model';
import { ApplicationsListComponent } from './applications-list.component';

const apps: Application[] = [
  { id: 'aaaaaaaa-1', name: 'Alpha', description: 'Primera', active: true, createdDate: 'c1', lastUpdate: 'u1' },
  { id: 'bbbbbbbb-2', name: 'Beta', active: false },
  ...Array.from({ length: 12 }, (_, i) => ({ id: `id-${i}`, name: `Extra ${i}`, active: true })),
];

describe('ApplicationsListComponent', () => {
  let service: jasmine.SpyObj<ApplicationService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;
  let directory: ApplicationDirectoryService;

  async function create(list: Application[] = apps) {
    service = jasmine.createSpyObj('ApplicationService', ['getAll', 'getByIds', 'update', 'delete']);
    service.getAll.and.returnValue(of(list));
    service.getByIds.and.returnValue(of([apps[0]]));
    service.update.and.returnValue(of(apps[0]));
    service.delete.and.returnValue(of(undefined));
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApplicationService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    directory = TestBed.inject(ApplicationDirectoryService);
    const fixture = TestBed.createComponent(ApplicationsListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('lists applications, paginated, and feeds the directory', async () => {
    const dom = await create();
    expect(dom.qa('tbody tr').length).toBe(10);
    expect(dom.text).toContain('Alpha');
    expect(dom.text).toContain('1–10 de 14');
    expect(directory.all().length).toBe(14);
    dom.clickByText('button', 'Siguiente');
    expect(dom.text).toContain('11–14 de 14');
    dom.clickByText('button', 'Anterior');
    expect(dom.text).toContain('1–10');
  });

  it('shows the empty state', async () => {
    const dom = await create([]);
    expect(dom.text).toContain('No hay aplicaciones registradas');
  });

  it('filters by name and status and resets to the first page', async () => {
    const dom = await create();
    dom.type('input[placeholder^="Buscar por nombre"]', 'alp');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('input[placeholder^="Buscar por nombre"]', '');
    dom.type('select:nth-of-type(1)', 'inactive');
    expect(dom.qa('tbody tr').length).toBe(1);
    expect(dom.text).toContain('Beta');
    dom.type('select:nth-of-type(1)', 'active');
    expect(dom.qa('tbody tr').length).toBe(10);
    dom.pick('select:nth-of-type(2)', 2);
    expect(dom.qa('tbody tr').length).toBe(13);
  });

  it('searches by ids through the API and reloads all when cleared', async () => {
    const dom = await create();
    dom.type('input[aria-label="Filtrar por IDs"]', 'aaaaaaaa-1, x');
    dom.submit();
    expect(service.getByIds).toHaveBeenCalledWith(['aaaaaaaa-1', 'x']);
    expect(dom.qa('tbody tr').length).toBe(1);

    service.getAll.calls.reset();
    dom.type('input[aria-label="Filtrar por IDs"]', '');
    dom.submit();
    expect(service.getAll).toHaveBeenCalled();
  });

  it('reports id search errors', async () => {
    const dom = await create();
    service.getByIds.and.returnValue(throwError(() => new Error('x')));
    dom.type('input[aria-label="Filtrar por IDs"]', 'a');
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al buscar las aplicaciones');
    expect(dom.text).not.toContain('Cargando aplicaciones');
  });

  it('opens the edit form remembering the selected application', async () => {
    const dom = await create();
    dom.clickByText('button[title=Editar]', '');
    expect(TestBed.inject(ApplicationEditState).current()?.id).toBe('aaaaaaaa-1');
    expect(router.navigate).toHaveBeenCalledWith(['/applications', 'aaaaaaaa-1', 'edit']);
  });

  it('deactivates after confirmation', async () => {
    const dom = await create();
    dom.click('button[title=Desactivar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    const [id, req] = service.update.calls.mostRecent().args;
    expect(id).toBe('aaaaaaaa-1');
    expect(req.application.active).toBeFalse();
    expect(req.dateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(toast.success).toHaveBeenCalledWith('Aplicación desactivada');
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('cancels the deactivation and reports errors', async () => {
    const dom = await create();
    dom.click('button[title=Desactivar]');
    dom.clickByText('app-confirm-dialog button', 'Cancelar');
    expect(service.update).not.toHaveBeenCalled();
    service.update.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title=Desactivar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al desactivar la aplicación');
  });

  it('deletes after confirmation, updating the list and directory', async () => {
    const dom = await create();
    dom.click('button[title=Eliminar]');
    expect(dom.text).toContain('Eliminar aplicación');
    dom.clickByText('app-confirm-dialog button', 'Eliminar');
    expect(service.delete).toHaveBeenCalledWith('aaaaaaaa-1');
    expect(toast.success).toHaveBeenCalledWith('Aplicación "Alpha" eliminada');
    expect(directory.all().some((a) => a.id === 'aaaaaaaa-1')).toBeFalse();
    expect(dom.text).not.toContain('Alpha');
  });

  it('cancels a deletion and reports delete errors', async () => {
    const dom = await create();
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Cancelar');
    expect(service.delete).not.toHaveBeenCalled();
    expect(dom.q('app-confirm-dialog')).toBeNull();

    service.delete.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Eliminar');
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar la aplicación');
    expect(dom.text).toContain('Alpha');
  });

  it('reports load errors', async () => {
    service = jasmine.createSpyObj('ApplicationService', ['getAll']);
    service.getAll.and.returnValue(throwError(() => new Error('x')));
    toast = jasmine.createSpyObj('ToastService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApplicationService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.createComponent(ApplicationsListComponent).detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar las aplicaciones');
  });
});
