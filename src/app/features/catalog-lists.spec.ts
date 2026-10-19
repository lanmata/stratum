import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ContactTypeService } from '@core/services/contact-type.service';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { ToastService } from '@core/services/toast.service';
import { ContactTypesListComponent } from './contact-types/contact-types-list/contact-types-list.component';
import { NoticeTypesListComponent } from './notice-types/notice-types-list/notice-types-list.component';
import { ServiceTypesListComponent } from './service-types/service-types-list/service-types-list.component';

const rows = [
  { id: '1', name: 'Uno', description: 'Primero', active: true },
  { id: '2', name: 'Dos', active: false },
];

function setup<T>(component: new () => T, token: unknown, service: Record<string, unknown>) {
  const toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: token as never, useValue: service }, { provide: ToastService, useValue: toast }],
  });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { dom: new Dom(fixture), toast };
}

describe('ContactTypesListComponent', () => {
  let service: jasmine.SpyObj<ContactTypeService>;
  const create = () => {
    service = jasmine.createSpyObj('ContactTypeService', ['getAll', 'getByIds', 'delete']);
    service.getAll.and.returnValue(of(rows));
    service.getByIds.and.returnValue(of([rows[0]]));
    service.delete.and.returnValue(of(rows[0]));
    return setup(ContactTypesListComponent, ContactTypeService, service as never);
  };

  it('lists contact types', () => {
    const { dom } = create();
    expect(dom.text).toContain('Uno');
    expect(dom.text).toContain('Primero');
    expect(dom.text).toContain('—');
    expect(dom.q('a[href="/contact-types/1/edit"]')).not.toBeNull();
  });

  it('filters by ids and reloads everything when the filter is cleared', async () => {
    const { dom } = create();
    await dom.stable();
    dom.type('input[name=ids]', ' 1, 2 ');
    dom.submit();
    expect(service.getByIds).toHaveBeenCalledWith(['1', '2']);
    expect(dom.qa('tbody tr').length).toBe(1);

    service.getAll.calls.reset();
    dom.type('input[name=ids]', '');
    dom.submit();
    expect(service.getAll).toHaveBeenCalled();
  });

  it('reports errors when searching by ids', async () => {
    const { dom, toast } = create();
    await dom.stable();
    service.getByIds.and.returnValue(throwError(() => new Error('x')) as never);
    dom.type('input[name=ids]', '1');
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al buscar los tipos de contacto');
  });

  it('deletes after confirmation and reloads', () => {
    const { dom, toast } = create();
    dom.click('button[title=Eliminar]');
    expect(dom.q('app-confirm-dialog')).not.toBeNull();
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(service.delete).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('Tipo de contacto eliminado');
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('does nothing when confirm is triggered without a pending item, and reports delete errors', () => {
    const { dom, toast } = create();
    service.delete.and.returnValue(throwError(() => new Error('x')) as never);
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el tipo de contacto');
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Cancelar');
    expect(dom.q('app-confirm-dialog')).toBeNull();
  });

  it('reports load errors', () => {
    service = jasmine.createSpyObj('ContactTypeService', ['getAll']);
    service.getAll.and.returnValue(throwError(() => new Error('x')) as never);
    const { toast } = setup(ContactTypesListComponent, ContactTypeService, service as never);
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los tipos de contacto');
  });
});

describe('NoticeTypesListComponent', () => {
  let service: jasmine.SpyObj<NoticeTypeService>;
  const create = () => {
    service = jasmine.createSpyObj('NoticeTypeService', ['getAll', 'delete']);
    service.getAll.and.returnValue(of(rows));
    service.delete.and.returnValue(of({ id: '1', name: 'Uno', active: true }));
    return setup(NoticeTypesListComponent, NoticeTypeService, service as never);
  };

  it('lists notice types and deletes after confirmation', () => {
    const { dom, toast } = create();
    expect(dom.text).toContain('Uno');
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(service.delete).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('Tipo de aviso eliminado');
  });

  it('ignores confirmation of an item without id and reports errors', () => {
    service = jasmine.createSpyObj('NoticeTypeService', ['getAll', 'delete']);
    service.getAll.and.returnValue(of([{ name: 'Sin id', active: true } as never]));
    service.delete.and.returnValue(throwError(() => new Error('x')) as never);
    const { dom } = setup(NoticeTypesListComponent, NoticeTypeService, service as never);
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(service.delete).not.toHaveBeenCalled();
  });

  it('reports delete and load errors', () => {
    const { dom, toast } = create();
    service.delete.and.returnValue(throwError(() => new Error('x')) as never);
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el tipo de aviso');

    TestBed.resetTestingModule();
    service = jasmine.createSpyObj('NoticeTypeService', ['getAll']);
    service.getAll.and.returnValue(throwError(() => new Error('x')) as never);
    const failed = setup(NoticeTypesListComponent, NoticeTypeService, service as never);
    expect(failed.toast.error).toHaveBeenCalledWith('Error al cargar los tipos de aviso');
  });
});

describe('ServiceTypesListComponent', () => {
  let service: jasmine.SpyObj<ServiceTypeService>;
  const create = () => {
    service = jasmine.createSpyObj('ServiceTypeService', ['getAll', 'getByStatus', 'update']);
    service.getAll.and.returnValue(of(rows));
    service.getByStatus.and.callFake((active) => of(rows.filter((r) => r.active === active)));
    service.update.and.returnValue(of(rows[0]));
    return setup(ServiceTypesListComponent, ServiceTypeService, service as never);
  };

  it('lists all service types by default', () => {
    const { dom } = create();
    expect(service.getAll).toHaveBeenCalled();
    expect(dom.qa('tbody tr').length).toBe(2);
  });

  it('filters by status through the status endpoint, keeping only matching rows', () => {
    const { dom } = create();
    dom.type('select[aria-label="Filtrar por estado"]', 'active');
    expect(service.getByStatus).toHaveBeenCalledWith(true);
    expect(dom.qa('tbody tr').length).toBe(1);
    expect(dom.text).toContain('Uno');

    service.getByStatus.and.returnValue(of(rows));
    dom.type('select[aria-label="Filtrar por estado"]', 'inactive');
    expect(service.getByStatus).toHaveBeenCalledWith(false);
    expect(dom.qa('tbody tr').length).toBe(1);
    expect(dom.text).toContain('Dos');

    dom.type('select[aria-label="Filtrar por estado"]', 'all');
    expect(dom.qa('tbody tr').length).toBe(2);
  });

  it('deactivates after confirmation', () => {
    const { dom, toast } = create();
    dom.click('button[title=Desactivar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(service.update).toHaveBeenCalledWith('1', { serviceType: { ...rows[0], active: false } });
    expect(toast.success).toHaveBeenCalledWith('Tipo de servicio desactivado');
  });

  it('reports deactivate and load errors', () => {
    const { dom, toast } = create();
    service.update.and.returnValue(throwError(() => new Error('x')) as never);
    dom.click('button[title=Desactivar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al desactivar el tipo de servicio');

    TestBed.resetTestingModule();
    service = jasmine.createSpyObj('ServiceTypeService', ['getAll', 'getByStatus']);
    service.getAll.and.returnValue(throwError(() => new Error('x')) as never);
    const failed = setup(ServiceTypesListComponent, ServiceTypeService, service as never);
    expect(failed.toast.error).toHaveBeenCalledWith('Error al cargar los tipos de servicio');
  });
});
