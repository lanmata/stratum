import { afterNextRender, Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent, IconName } from '@shared/components/icon/icon.component';
import { NAV_ITEMS, QUICK_ACTIONS } from './nav-items';

interface PaletteEntry {
  path: string;
  label: string;
  hint: string;
  icon: IconName;
}

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ENTRIES: PaletteEntry[] = [
  ...NAV_ITEMS.map((i) => ({ path: i.path, label: i.label, hint: 'Ir a', icon: i.icon })),
  ...QUICK_ACTIONS.map((a) => ({ path: a.path, label: a.label, hint: 'Crear', icon: a.icon })),
];

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="animate-fade-in fixed inset-0 z-[70] flex items-start justify-center bg-gray-900/50 p-4 pt-[12vh] backdrop-blur-sm"
      (click)="closed.emit()"
      (keydown.escape)="closed.emit()"
    >
      <div
        class="animate-pop-in w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda rápida"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          <app-icon name="search" class="text-gray-400" />
          <input
            #input
            type="text"
            [value]="query()"
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
            placeholder="Ir a una sección o crear algo…"
            class="w-full bg-transparent py-4 text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100"
          />
          <kbd class="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600">Esc</kbd>
        </div>
        <ul class="max-h-80 overflow-y-auto p-2" role="listbox">
          @for (entry of results(); track entry.path; let i = $index) {
            <li role="presentation">
              <button
                type="button"
                role="option"
                [id]="'palette-option-' + i"
                [attr.aria-selected]="i === active()"
                (click)="go(entry)"
                (mouseenter)="active.set(i)"
                [class]="
                  i === active()
                    ? 'flex w-full items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                    : 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300'
                "
              >
                <app-icon [name]="entry.icon" size="h-4 w-4" />
                <span class="flex-1 truncate">{{ entry.label }}</span>
                <span class="text-xs text-gray-400">{{ entry.hint }}</span>
              </button>
            </li>
          } @empty {
            <li class="px-3 py-8 text-center text-sm text-gray-400">Sin resultados para “{{ query() }}”</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class CommandPaletteComponent {
  readonly closed = output<void>();

  private readonly router = inject(Router);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly results = computed(() => {
    const q = normalize(this.query().trim());
    return q ? ENTRIES.filter((e) => normalize(e.label).includes(q)) : ENTRIES;
  });

  constructor() {
    afterNextRender(() => this.input().nativeElement.focus());
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!count) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.active.update((i) => (i + step + count) % count);
      document.getElementById(`palette-option-${this.active()}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = this.results()[this.active()];
      if (entry) this.go(entry);
    }
  }

  protected go(entry: PaletteEntry): void {
    this.router.navigateByUrl(entry.path);
    this.closed.emit();
  }
}
