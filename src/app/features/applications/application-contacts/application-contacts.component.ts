import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ContactService } from '@core/services/contact.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { Contact, ContactType } from '@shared/models/contact.model';
import { emptyPage, Page } from '@shared/models/page.model';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const INPUT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

type StatusFilter = '' | 'true' | 'false';

@Component({
  selector: 'app-application-contacts',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-4">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Contactos de la aplicación</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Solo se muestran los contactos de esta aplicación, de a {{ pageSize }}. Se editan desde la ficha
          de cada persona; los de otras entidades (p. ej. un comercio) se gestionan por la API.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar por contenido…"
          aria-label="Buscar por contenido"
          [class]="inputClass"
        />
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
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      @if (loading()) {
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
              @for (contact of result().content; track contact.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ contact.content }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ contact.contactType.name }}</td>
                  <td class="px-4 py-3">
                    @if (contact.personId) {
                      <a
                        [routerLink]="['/people', contact.personId, 'edit']"
                        class="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Persona · {{ contact.personId.slice(0, 8) }}…
                      </a>
                    } @else {
                      <span class="text-xs text-gray-600 dark:text-gray-400">
                        {{ contact.ownerType }} · {{ contact.ownerId?.slice(0, 8) }}…
                      </span>
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
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No se encontraron contactos
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ result().totalElements }} contactos</span>
          @if (result().totalPages > 1) {
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="goTo(result().page - 1)"
                [disabled]="result().page === 0"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                ← Anterior
              </button>
              <span class="px-2">Página {{ result().page + 1 }} de {{ result().totalPages }}</span>
              <button
                type="button"
                (click)="goTo(result().page + 1)"
                [disabled]="result().page + 1 >= result().totalPages"
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
export class ApplicationContactsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contactService = inject(ContactService);
  private readonly contactTypeService = inject(ContactTypeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();
  private readonly applicationId = this.route.parent!.snapshot.paramMap.get('applicationId')!;

  protected readonly inputClass = INPUT_CLASS;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly loading = signal(true);
  protected readonly result = signal<Page<Contact>>(emptyPage(PAGE_SIZE));
  protected readonly contactTypes = signal<ContactType[]>([]);
  protected readonly search = signal('');
  protected readonly typeFilter = signal('');
  protected readonly statusFilter = signal<StatusFilter>('');

  constructor() {
    this.search$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(0));
  }

  ngOnInit(): void {
    this.contactTypeService.getAll().subscribe((types) => this.contactTypes.set(types));
    this.load(0);
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.search$.next(value.trim());
  }

  protected onTypeChange(value: string): void {
    this.typeFilter.set(value);
    this.load(0);
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.load(0);
  }

  protected goTo(page: number): void {
    const { totalPages } = this.result();
    if (page < 0 || page >= totalPages) return;
    this.load(page);
  }

  private load(page: number): void {
    this.loading.set(true);
    this.contactService
      .search({
        applicationId: this.applicationId,
        contactTypeId: this.typeFilter() || undefined,
        active: this.statusFilter() === '' ? undefined : this.statusFilter() === 'true',
        q: this.search(),
        page,
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error al cargar los contactos');
          this.loading.set(false);
        },
      });
  }
}
