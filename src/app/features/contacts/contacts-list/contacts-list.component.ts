import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactService } from '@core/services/contact.service';
import { Contact } from '@shared/models/contact.model';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Contacts</h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Value</th>
                <th class="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (contact of contacts(); track contact.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ contact.value }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{{ contact.contactTypeId }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="2" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No contacts found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ContactsListComponent implements OnInit {
  private readonly contactService = inject(ContactService);

  protected readonly contacts = signal<Contact[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.contactService.getAll().subscribe({
      next: (data) => {
        this.contacts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
