import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  private title = signal<string>('المعرفة الجامعية');

  setTitle(title: string) {
    this.title.set(title);
  }

  getTitle() {
    return this.title();
  }
}
