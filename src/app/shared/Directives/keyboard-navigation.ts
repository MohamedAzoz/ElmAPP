import { Directive, HostListener, Input, Output, EventEmitter, input, output } from '@angular/core';

@Directive({
  selector: '[appKeyboardNavigation]',
  standalone: true
})
export class KeyboardNavigation {
  appKeyboardNavigationEnabled = input<boolean>(true);
   optionsLength =input<number>(0);

  selectOption = output<number>();
  nextQuestion = output<void>();
  prevQuestion = output<void>();
  submitQuiz = output<void>();

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Only run if keyboard navigation is enabled and on screen width >= 1024px (desktop)
    if (!this.appKeyboardNavigationEnabled() || window.innerWidth < 1024) {
      return;
    }

    // Ignore keypresses if user is typing in a form control or contenteditable element
    const activeEl = document.activeElement;
    if (activeEl) {
      const tagName = activeEl.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        activeEl.hasAttribute('contenteditable') ||
        (activeEl as HTMLElement).isContentEditable
      ) {
        return;
      }
    }

    const code = event.code;
    const key = event.key.toLowerCase();

    console.log('Keyboard Navigation - Physical Key:', code, 'Literal Key:', key, 'Options Length:', this.optionsLength());

    // 1. Handle Option keys: KeyA, KeyB, KeyC, KeyD (layout-independent) with character fallback
    const optionCodes = ['KeyA', 'KeyB', 'KeyC', 'KeyD'];
    let optionIndex = optionCodes.indexOf(code);
    if (optionIndex === -1) {
      const optionKeys = ['a', 'b', 'c', 'd'];
      optionIndex = optionKeys.indexOf(key);
    }

    if (optionIndex !== -1) {
      if (optionIndex < this.optionsLength()) {
        event.preventDefault();
        this.selectOption.emit(optionIndex);
      }
      return;
    }

    // 2. Handle Arrow keys: Right for Next, Left for Previous
    if (code === 'ArrowRight') {
      event.preventDefault();
      this.nextQuestion.emit();
      return;
    }
    if (code === 'ArrowLeft') {
      event.preventDefault();
      this.prevQuestion.emit();
      return;
    }

    // 3. Handle Submit keys: KeyS or 's' (layout-independent)
    if (code === 'KeyS' || key === 's') {
      event.preventDefault();
      this.submitQuiz.emit();
      return;
    }
  }
}
