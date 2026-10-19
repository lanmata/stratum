import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApplicationService } from '@core/services/application.service';
import { ContactService } from '@core/services/contact.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { Application } from '@shared/models/application.model';
import { Contact, ContactType } from '@shared/models/contact.model';
import { PageResponse } from '@shared/models/page.model';
import { parseIds } from '@shared/utils/ids.util';

type StatusFilter = '' | 'true' | 'false';

const PAGE_SIZE = 20;
const INPUT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';
const BUTTON_CLASS =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Contactos</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Directorio de contactos de una aplicación (personas y propietarios externos), paginado en el servidor. Los de
          una persona se editan desde su ficha.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <select
          [ngModel]="applicationId()"
          (ngModelChange)="onApplicationChange($event)"
          aria-label="Aplicación"
          [class]="inputClass"
        >
          <option value="">Selecciona una aplicación</option>
          @for (app of applications(); track app.id) {
            <option [value]="app.id">{{ app.name }}</option>
          }
        </select>
        <form class="flex gap-2" (ngSubmit)="applyText()">
          <input
            type="text"
            name="q"
            [ngModel]="searchInput()"
            (ngModelChange)="searchInput.set($event)"
            placeholder="Buscar por contenido…"
            aria-label="Buscar por contenido"
            [class]="inputClass"
          />
          <button type="submit" [disabled]="!applicationId()" [class]="buttonClass">Buscar</button>
        </form>
        <select
          [ngModel]="typeFilter()"
          (ngModelChange)="onTypeChange($event)"
          aria-label="Filtrar por tipo"
          [class]="inputClass"
        >
          <option value="">Todos los tipos</option>
          @for (type of contactTypes(); track type.id) {
            <option [value]="type.id">{{ type.name }}</option>
          }
        </select>
        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          aria-label="Filtrar por estado"
          [class]="inputClass"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <form class="flex gap-2" (ngSubmit)="searchByIds()">
          <input
            type="text"
            name="ids"
            [ngModel]="idsInput()"
            (ngModelChange)="idsInput.set($event)"
            placeholder="Filtrar por IDs (separados por coma)…"
            aria-label="Filtrar por IDs"
            [class]="inputClass + ' w-72'"
          />
          <button type="submit" [class]="buttonClass">Buscar por IDs</button>
        </form>
        <form class="flex gap-2" (ngSubmit)="searchByOwner()">
          <input
            type="text"
            name="ownerType"
            [ngModel]="ownerType()"
            (ngModelChange)="ownerType.set($event)"
            placeholder="Tipo de propietario (MERCHANT)"
            aria-label="Tipo de propietario"
            [class]="inputClass + ' w-52'"
          />
          <input
            type="text"
            name="ownerId"
            [ngModel]="ownerId()"
            (ngModelChange)="ownerId.set($event)"
            placeholder="ID del propietario"
            aria-label="ID del propietario"
            [class]="inputClass + ' w-72'"
          />
          <button type="submit" [disabled]="!ownerType().trim() || !ownerId().trim()" [class]="buttonClass">
            Buscar por propietario
          </button>
        </form>
        @if (mode() !== 'directory') {
          <button type="button" (click)="backToDirectory()" class="text-sm text-gray-500 hover:underline dark:text-gray-400">
            Volver al directorio
          </button>
        }
      </div>

      @if (!applicationId() && mode() !== 'ids') {
        <p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          Selecciona una aplicación: los contactos nunca se listan entre aplicaciones.
        </p>
      } @else if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Contenido</th>
                <th class="px-4 py-3">Tipo</th>
                <th class="px-4 py-3">Titular</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (contact of contacts(); track contact.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ contact.content }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ contact.contactType.name }}</td>
                  <td class="px-4 py-3">
                    @if (contact.personId) {
                      <a [routerLink]="['/people', contact.personId, 'edit']" class="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400">
                        {{ contact.personId.slice(0, 8) }}…
                      </a>
                    } @else if (contact.ownerType) {
                      <span class="font-mono text-xs text-gray-600 dark:text-gray-400" [title]="contact.ownerId ?? ''">
                        {{ contact.ownerType }} · {{ (contact.ownerId ?? '').slice(0, 8) }}…
                      </span>
                    } @else {
                      <span class="text-gray-400 dark:text-gray-500">—</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    @if (contact.active) {
                      <span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Activo</span>
                    } @else {
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactivo</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron contactos</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ total() }} contactos</span>
          @if (totalPages() > 1) {
            <div class="flex items-center gap-2">
              <button
                (click)="goTo(page() - 1)"
                [disabled]="page() === 0"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                ← Anterior
              </button>
              <span class="px-2">Página {{ page() + 1 }} de {{ totalPages() }}</span>
              <button
                (click)="goTo(page() + 1)"
                [disabled]="page() + 1 >= totalPages()"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Siguiente →
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ContactsListComponent implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly contactTypeService = inject(ContactTypeService);
  private readonly applicationService = inject(ApplicationService);
  private readonly toast = inject(ToastService);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly buttonClass = BUTTON_CLASS;

  protected readonly applications = signal<Application[]>([]);
  protected readonly contactTypes = signal<ContactType[]>([]);
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly loading = signal(false);

  protected readonly applicationId = signal('');
  protected readonly searchInput = signal('');
  protected readonly typeFilter = signal('');
  protected readonly statusFilter = signal<StatusFilter>('');
  protected readonly idsInput = signal('');
  protected readonly ownerType = signal('');
  protected readonly ownerId = signal('');

  /** `directory` pages through the application on the server; `ids` and `owner` return a bounded list. */
  protected readonly mode = signal<'directory' | 'ids' | 'owner'>('directory');
  protected readonly page = signal(0);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);

  private readonly appliedText = signal('');

  ngOnInit(): void {
    this.contactTypeService
      .getAll()
      .pipe(catchError(() => of([] as ContactType[])))
      .subscribe((types) => this.contactTypes.set(types));
    this.applicationService
      .getAll()
      .pipe(catchError(() => of([] as Application[])))
      .subscribe((apps) => {
        this.applications.set(apps);
        if (apps.length > 0) this.onApplicationChange(apps[0].id);
      });
  }

  protected onApplicationChange(id: string): void {
    this.applicationId.set(id);
    this.backToDirectory();
  }

  protected onTypeChange(value: string): void {
    this.typeFilter.set(value);
    this.backToDirectory();
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.backToDirectory();
  }

  protected applyText(): void {
    this.appliedText.set(this.searchInput().trim());
    this.backToDirectory();
  }

  protected backToDirectory(): void {
    this.mode.set('directory');
    this.loadPage(0);
  }

  protected goTo(page: number): void {
    this.loadPage(Math.min(Math.max(0, page), this.totalPages() - 1));
  }

  protected searchByIds(): void {
    const ids = parseIds(this.idsInput());
    if (ids.length === 0) {
      this.backToDirectory();
      return;
    }
    this.mode.set('ids');
    this.loadList(this.contactService.getByIds(ids));
  }

  protected searchByOwner(): void {
    const type = this.ownerType().trim();
    const id = this.ownerId().trim();
    if (!type || !id) return;
    this.mode.set('owner');
    this.loadList(this.contactService.getByOwner(type, id, this.applicationId() || undefined));
  }

  private loadPage(page: number): void {
    const applicationId = this.applicationId();
    if (!applicationId) {
      this.contacts.set([]);
      return;
    }
    const status = this.statusFilter();
    this.loading.set(true);
    this.contactService
      .search({
        applicationId,
        page,
        size: PAGE_SIZE,
        ...(this.typeFilter() ? { contactTypeId: this.typeFilter() } : {}),
        ...(status ? { active: status === 'true' } : {}),
        ...(this.appliedText() ? { q: this.appliedText() } : {}),
      })
      .subscribe({
        next: (res: PageResponse<Contact>) => {
          this.contacts.set(res.content);
          this.page.set(res.page);
          this.total.set(res.totalElements);
          this.totalPages.set(Math.max(1, res.totalPages));
          this.loading.set(false);
        },
        error: () => this.failed(),
      });
  }

  private loadList(source$: Observable<Contact[]>): void {
    this.loading.set(true);
    source$.subscribe({
      next: (list) => {
        this.contacts.set(list);
        this.page.set(0);
        this.total.set(list.length);
        this.totalPages.set(1);
        this.loading.set(false);
      },
      error: () => this.failed(),
    });
  }

  private failed(): void {
    this.toast.error('Error al cargar los contactos');
    this.loading.set(false);
  }
}
