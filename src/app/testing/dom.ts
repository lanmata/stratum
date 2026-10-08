import { ComponentFixture } from '@angular/core/testing';

export class Dom<T> {
  constructor(readonly fixture: ComponentFixture<T>) {}

  get el(): HTMLElement {
    return this.fixture.nativeElement as HTMLElement;
  }

  q<E extends HTMLElement = HTMLElement>(selector: string): E | null {
    return this.el.querySelector<E>(selector);
  }

  qa<E extends HTMLElement = HTMLElement>(selector: string): E[] {
    return Array.from(this.el.querySelectorAll<E>(selector));
  }

  /** Lets template-driven forms (ngModel) finish registering their controls. */
  async stable(): Promise<void> {
    await this.fixture.whenStable();
    this.fixture.detectChanges();
  }

  get text(): string {
    return this.el.textContent ?? '';
  }

  click(selector: string | HTMLElement): void {
    const target = typeof selector === 'string' ? this.q(selector) : selector;
    if (!target) throw new Error(`Element not found: ${selector}`);
    target.click();
    this.fixture.detectChanges();
  }

  clickByText(selector: string, text: string): void {
    const target = this.qa(selector).find((e) => (e.textContent ?? '').includes(text));
    if (!target) throw new Error(`No ${selector} containing "${text}"`);
    this.click(target);
  }

  type(selector: string | HTMLElement, value: string): void {
    const target = (typeof selector === 'string' ? this.q(selector) : selector) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null;
    if (!target) throw new Error(`Element not found: ${selector}`);
    target.value = value;
    target.dispatchEvent(new Event(target.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    this.fixture.detectChanges();
  }

  /** Selects an <option> by index; needed for selects bound with [ngValue]. */
  pick(selector: string, index: number): void {
    const target = this.q<HTMLSelectElement>(selector);
    if (!target) throw new Error(`Element not found: ${selector}`);
    target.selectedIndex = index;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    this.fixture.detectChanges();
  }

  check(selector: string, checked: boolean): void {
    const target = this.q<HTMLInputElement>(selector);
    if (!target) throw new Error(`Element not found: ${selector}`);
    target.checked = checked;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    this.fixture.detectChanges();
  }

  submit(selector = 'form'): void {
    const form = this.q<HTMLFormElement>(selector);
    if (!form) throw new Error(`Form not found: ${selector}`);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    this.fixture.detectChanges();
  }
}
