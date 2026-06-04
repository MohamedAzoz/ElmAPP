import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-thumbnails',
  imports: [],
  templateUrl: './page-thumbnails.html',
  styleUrl: './page-thumbnails.css',
  host: {
    '[class.collapsed]': 'isCollapsed()',
  }
})
export class PageThumbnailsComponent {
  /** Total number of pages in the PDF */
  totalPages = input.required<number>();

  /** Currently active page (1-indexed) */
  currentPage = input.required<number>();

  /** Whether the sidebar is collapsed */
  isCollapsed = input<boolean>(false);

  /** Emits when a page is selected */
  pageSelected = output<number>();

  /** Emits to toggle sidebar visibility */
  toggleSidebar = output<void>();

  /** Emits when a new page is added */
  addPage = output<void>();

  /** Generate page numbers array from totalPages */
  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  onAddPageClick(): void {
    this.addPage.emit();
  }

  /** Navigate to a specific page */
  onPageClick(page: number): void {
    this.pageSelected.emit(page);
  }

  /** Toggle the sidebar open/close */
  onToggle(): void {
    this.toggleSidebar.emit();
  }
}
