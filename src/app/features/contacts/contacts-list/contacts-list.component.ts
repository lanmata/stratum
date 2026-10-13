import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ContactService } from '@core/services/contact.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { Contact, ContactType } from '@shared/models/contact.model';
import { parseIds } from '@shared/utils/ids.util';

const INPUT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Contactos</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Directorio de todos los contactos registrados. Se editan desde la ficha de cada persona.
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
          <button
            type="submit"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Buscar por IDs
          </button>
        </form>
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
                <th class="px-4 py-3">Persona</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (contact of paginated(); track contact.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ contact.content }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ contact.contactType.name }}</td>
                  <td class="px-4 py-3">
                    <a [routerLink]="['/people', contact.personId, 'edit']" class="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400">
                      {{ contact.personId.slice(0, 8) }}…
                    </a>
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

        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{{ filtered().length }} contactos</span>
            <div class="flex items-center gap-2">
              <button
                (click)="prevPage()"
                [disabled]="currentPage() === 1"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                ← Anterior
              </button>
              <span class="px-2">Página {{ currentPage() }} de {{ totalPages() }}</span>
              <button
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages()"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Siguiente →
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ContactsListComponent implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly contactTypeService = inject(ContactTypeService);
  private readonly toast = inject(ToastService);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly pageSize = 10;

  private readonly contacts = signal<Contact[]>([]);
  protected readonly contactTypes = signal<ContactType[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly typeFilter = signal('');
  protected readonly idsInput = signal('');
  protected readonly currentPage = signal(1);

  protected readonly filtered = computed(() => {
    const text = this.search().toLowerCase().trim();
    const type = this.typeFilter();
    return this.contacts().filter(
      (c) =>
        (!text || c.content.toLowerCase().includes(text)) &&
        (!type || c.contactType.id === type),
    );
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  protected readonly paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.contactTypeService
      .getAll()
      .pipe(catchError(() => of([] as ContactType[])))
      .subscribe((types) => this.contactTypes.set(types));
    this.load();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  protected onTypeChange(value: string): void {
    this.typeFilter.set(value);
    this.currentPage.set(1);
  }

  protected searchByIds(): void {
    this.load();
  }

  protected prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  private load(): void {
    this.loading.set(true);
    const ids = parseIds(this.idsInput());
    const source$ = ids.length > 0 ? this.contactService.getByIds(ids) : this.contactService.getAll();
    source$.subscribe({
      next: (list) => {
        this.contacts.set(list);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los contactos');
        this.loading.set(false);
      },
    });
  }
}
