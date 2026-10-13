import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { Dom } from './dom';

export interface CatalogFormOptions {
  component: Type<unknown>;
  service: Type<unknown>;
  idParam: string;
  listPath: string;
  requestKey: string;
  messages: { created: string; updated: string; saveError: string; loadError: string };
}

const entity = { id: 'e1', name: 'Nombre', description: 'Desc', active: false };

export function describeCatalogForm(title: string, o: CatalogFormOptions): void {
  describe(title, () => {
    let service: jasmine.SpyObj<{ getById: unknown; create: unknown; update: unknown }>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    function create(id: string | null) {
      service = jasmine.createSpyObj('Service', ['getById', 'create', 'update']);
      (service.getById as jasmine.Spy).and.returnValue(of(entity));
      (service.create as jasmine.Spy).and.returnValue(of(entity));
      (service.update as jasmine.Spy).and.returnValue(of(entity));
      toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: o.service, useValue: service },
          { provide: ToastService, useValue: toast },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap(id ? { [o.idParam]: id } : {}) } },
          },
        ],
      });
      router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
    }

    function render() {
      const fixture = TestBed.createComponent(o.component);
      fixture.detectChanges();
      return new Dom(fixture);
    }

    it('starts empty in create mode with submit disabled', () => {
      create(null);
      const dom = render();
      expect(dom.text).toContain('Nuevo');
      expect(service.getById).not.toHaveBeenCalled();
      expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
    });

    it('validates that the name is required', () => {
      create(null);
      const dom = render();
      dom.q<HTMLInputElement>('input[formControlName=name]')!.dispatchEvent(new Event('blur'));
      dom.fixture.detectChanges();
      expect(dom.text).toContain('obligatorio');
      dom.submit();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('creates the entry and goes back to the list', () => {
      create(null);
      const dom = render();
      dom.type('input[formControlName=name]', 'Nuevo nombre');
      dom.type('textarea[formControlName=description]', 'Una descripción');
      dom.submit();
      const req = (service.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(req[o.requestKey]).toEqual(
        jasmine.objectContaining({ name: 'Nuevo nombre', description: 'Una descripción', active: true }),
      );
      expect(toast.success).toHaveBeenCalledWith(o.messages.created);
      expect(router.navigate).toHaveBeenCalledWith([o.listPath]);
    });

    it('omits an empty description', () => {
      create(null);
      const dom = render();
      dom.type('input[formControlName=name]', 'Solo nombre');
      dom.submit();
      const req = (service.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(req[o.requestKey].description).toBeUndefined();
    });

    it('loads the entry in edit mode and updates it', () => {
      create('e1');
      const dom = render();
      expect(service.getById).toHaveBeenCalledWith('e1');
      expect(dom.text).toContain('Editar');
      expect(dom.q<HTMLInputElement>('input[formControlName=name]')!.value).toBe('Nombre');
      expect(dom.q<HTMLInputElement>('input[formControlName=active]')!.checked).toBeFalse();

      dom.type('input[formControlName=name]', 'Renombrado');
      dom.submit();
      const [id, req] = (service.update as jasmine.Spy).calls.mostRecent().args;
      expect(id).toBe('e1');
      expect(req[o.requestKey].name).toBe('Renombrado');
      expect(toast.success).toHaveBeenCalledWith(o.messages.updated);
      expect(router.navigate).toHaveBeenCalledWith([o.listPath]);
    });

    it('handles entries without description when editing', () => {
      create('e1');
      (service.getById as jasmine.Spy).and.returnValue(of({ ...entity, description: undefined }));
      const dom = render();
      expect(dom.q<HTMLTextAreaElement>('textarea[formControlName=description]')!.value).toBe('');
    });

    it('reports save errors and re-enables the form', () => {
      create(null);
      (service.create as jasmine.Spy).and.returnValue(throwError(() => new Error('x')));
      const dom = render();
      dom.type('input[formControlName=name]', 'X');
      dom.submit();
      expect(toast.error).toHaveBeenCalledWith(o.messages.saveError);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeFalse();
    });

    it('goes back to the list when the entry cannot be loaded', () => {
      create('e1');
      (service.getById as jasmine.Spy).and.returnValue(throwError(() => new Error('x')));
      render();
      expect(toast.error).toHaveBeenCalledWith(o.messages.loadError);
      expect(router.navigate).toHaveBeenCalledWith([o.listPath]);
    });
  });
}
