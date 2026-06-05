import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PDFDocument, rgb } from 'pdf-lib';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

import { EditorToolbarComponent } from './components/toolbar/editor-toolbar';
import { PageThumbnailsComponent } from './components/page-thumbnails/page-thumbnails';
import type { EditorTool, Annotation } from './models/editor.models';

@Component({
  selector: 'app-pdf-editor-component',
  imports: [NgxExtendedPdfViewerModule, EditorToolbarComponent, PageThumbnailsComponent],
  templateUrl: './pdf-editor-component.html',
  styleUrl: './pdf-editor-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  // ─── Editor State Signals ──────────────────────────────────────

  /** PDF source (ArrayBuffer or URL) */
  pdfSrc = signal<string | ArrayBuffer | Uint8Array | null>(null);

  /** Raw PDF bytes for pdf-lib modifications */
  pdfBytes = signal<Uint8Array | null>(null);

  /** Current page number (1-indexed) */
  currentPage = signal(1);

  /** Total number of pages */
  totalPages = signal(0);

  /** Zoom level percentage */
  zoom = signal(100);

  /** Active editing tool */
  activeTool = signal<EditorTool>('select');

  /** Active editor mode ('view' | 'edit' | 'annotate') */
  currentMode = signal<'view' | 'edit' | 'annotate'>('edit');

  /** Current file name */
  fileName = signal('Elm_Document.pdf');

  /** All annotations on the document */
  annotations = signal<Annotation[]>([]);

  /** Currently selected annotation */
  selectedAnnotation = signal<Annotation | null>(null);

  /** Whether the thumbnails sidebar is visible */
  isSidebarOpen = signal(true);

  /** Whether the properties panel is visible */
  isPropertiesPanelOpen = signal(true);

  /** Whether a PDF is loaded */
  isDocumentLoaded = signal(false);

  /** Whether the document has unsaved changes */
  hasUnsavedChanges = signal(false);

  private readonly db = inject(CatbeeIndexedDBService);
  private readonly draftStore = 'pdfDrafts';
  private readonly draftKey = 'editor-draft';
  private draftTimer: number | null = null;

  /** Status message shown briefly in the header */
  statusMessage = signal<string | null>(null);

  /** Whether to show mobile sidebar overlay */
  isMobileSidebarOpen = signal(false);

  /** Whether to show mobile properties overlay */
  isMobilePropsOpen = signal(false);

  // ─── Undo / Redo History ───────────────────────────────────────
  undoStack: Annotation[][] = [];
  redoStack: Annotation[][] = [];

  private observer: MutationObserver | null = null;

  // ─── Constructor & Reactivity ──────────────────────────────────
  constructor() {
    // Re-render annotations automatically when signals change
    effect(() => {
      this.annotations();
      this.currentPage();
      this.selectedAnnotation();
      this.currentMode();
      this.isDocumentLoaded();
      this.pdfBytes();
      this.hasUnsavedChanges();

      if (this.isDocumentLoaded() && this.hasUnsavedChanges()) {
        this.scheduleAutoSave();
      }

      // Schedule rendering outside current microtask to ensure DOM is updated
      setTimeout(() => this.renderAnnotations(), 20);
    });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadDraft().catch(() => {
      console.warn('No draft loaded');
    });
  }

  ngAfterViewInit(): void {
    // Setup observer to watch when pages are rendered/resized in the DOM
    const viewerContainer = document.getElementById('viewerContainer');
    if (viewerContainer) {
      this.observer = new MutationObserver((mutations) => {
        let shouldRender = false;
        for (const m of mutations) {
          if (m.type === 'childList') {
            const addedPages = Array.from(m.addedNodes).some(
              (node) =>
                node instanceof HTMLElement &&
                (node.classList.contains('page') || node.querySelector('.page')),
            );
            if (addedPages) {
              shouldRender = true;
              break;
            }
          }
          if (
            m.type === 'attributes' &&
            m.target instanceof HTMLElement &&
            m.target.classList.contains('page')
          ) {
            shouldRender = true;
            break;
          }
        }
        if (shouldRender) {
          this.renderAnnotations();
        }
      });

      this.observer.observe(viewerContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
    }
  }

  // ─── Draft Persistence ───────────────────────────────────────────

  private async loadDraft(): Promise<void> {
    try {
      const draft = await firstValueFrom(
        this.db.getByID<{
          id: string;
          fileName: string;
          currentDriveFileId?: string | null;
          annotations: Annotation[];
          pdfBase64: string;
          savedAt: number;
        }>(this.draftStore, this.draftKey),
      );

      if (!draft || !draft.pdfBase64) {
        return;
      }

      const bytes = this.base64ToBytes(draft.pdfBase64);
      this.pdfBytes.set(bytes);
      this.pdfSrc.set(bytes);
      this.fileName.set(draft.fileName || 'Elm_Document.pdf');
      this.annotations.set(draft.annotations || []);
      this.isDocumentLoaded.set(true);
      this.hasUnsavedChanges.set(true);
      this.showStatus('تم استعادة نسخة المسودة التلقائية');
    } catch (err) {
      console.warn('[PdfEditor] No draft loaded or failed to restore:', err);
    }
  }

  private scheduleAutoSave(): void {
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
    }
    this.draftTimer = window.setTimeout(() => {
      this.saveDraft().catch(() => {
        console.warn('Auto-save failed');
      });
    }, 2000);
  }

  private async saveDraft(): Promise<void> {
    const bytes = this.pdfBytes();
    if (!bytes || !this.isDocumentLoaded()) return;

    const payload = {
      id: this.draftKey,
      fileName: this.fileName(),
      annotations: this.annotations(),
      pdfBase64: this.bytesToBase64(bytes),
      savedAt: Date.now(),
    };

    await firstValueFrom(this.db.update(this.draftStore, payload));
    this.showStatus('تم حفظ المسودة تلقائياً');
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
      this.draftTimer = null;
    }
  }

  private async deleteDraft(): Promise<void> {
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
      this.draftTimer = null;
    }

    try {
      await firstValueFrom(this.db.deleteByKey(this.draftStore, this.draftKey));
    } catch {
      // ignore delete failure
    }
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const slice = bytes.subarray(offset, offset + chunkSize);
      binary += String.fromCharCode(...slice);
    }
    return window.btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // ─── File Operations ────────────────────────────────────────────

  /** Create a blank document */
  openFile(): void {
    this.createBlankDocument();
  }

  exportFile(): void {
    this.exportToLocal().catch(() => {
      console.warn('Export failed');
    });
  }

  /** Export to local device */
  async exportToLocal(): Promise<void> {
    try {
      const modifiedBytes = await this.applyAnnotations();
      // Update viewer before initiating download
      this.pdfBytes.set(modifiedBytes);
      this.pdfSrc.set(modifiedBytes);
      const blob = new Blob([modifiedBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName();
      a.click();
      URL.revokeObjectURL(url);
      this.hasUnsavedChanges.set(false);
      this.showStatus('تم تحميل الملف');
    } catch {
      this.showStatus('فشل تصدير الملف');
    }
  }

  /** Save locally by downloading and clearing the IndexedDB draft */
  async save(): Promise<void> {
    if (!this.isDocumentLoaded()) return;

    try {
      await this.exportToLocal();
      await this.deleteDraft();
      this.hasUnsavedChanges.set(false);
      this.showStatus('تم حفظ الملف وتنزيله بنجاح');
    } catch {
      this.showStatus('فشل الحفظ');
    }
  }

  // ─── PDF Viewer Events ──────────────────────────────────────────

  /** Called when pdf viewer finishes loading pages */
  onPagesLoaded(event: { pagesCount: number }): void {
    this.totalPages.set(event.pagesCount);
  }

  /** Called when page changes */
  onPageChange(page: number | undefined): void {
    if (page != null) {
      this.currentPage.set(page);
    }
  }

  /** Navigate to a specific page */
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  // ─── Tool & Annotation Operations ──────────────────────────────

  /** Change the active editing tool */
  onToolSelected(tool: EditorTool): void {
    this.activeTool.set(tool);
    if (tool !== 'select') {
      this.selectedAnnotation.set(null);
    }
  }

  /** Update properties of the selected annotation */
  onPropertiesChanged(props: Partial<Annotation>): void {
    const selected = this.selectedAnnotation();
    if (!selected) return;

    this.saveHistory(this.annotations());

    const updated: Annotation = { ...selected, ...props };
    this.selectedAnnotation.set(updated);

    this.annotations.update((list) => list.map((a) => (a.id === selected.id ? updated : a)));
    this.hasUnsavedChanges.set(true);
  }

  /** Handle canvas click for creating new annotations */
  onCanvasClick(event: MouseEvent): void {
    const tool = this.activeTool();
    if (tool === 'select') {
      const target = event.target as HTMLElement;
      if (target.classList.contains('pdf-canvas-area') || target.closest('.pdfViewer')) {
        this.selectedAnnotation.set(null);
      }
      return;
    }

    const target = event.target as HTMLElement;
    const pageEl = target.closest('.page') as HTMLElement;
    if (!pageEl) return;

    const pageNum = parseInt(pageEl.getAttribute('data-page-number') || '1', 10);
    const rect = pageEl.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert to percentage coordinates (0-100)
    const x = (clickX / rect.width) * 100;
    const y = (clickY / rect.height) * 100;

    // Default sizing in percentages
    const width = tool === 'text' ? 25 : 15;
    const height = tool === 'text' ? 4 : 8;
    // If image tool: prompt for an image file instead of creating empty box
    if (tool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const imgWidth = 30;
          const imgHeight = 20;
          this.createImageAnnotation(
            pageNum,
            Math.max(0, Math.min(100 - imgWidth, x)),
            Math.max(0, Math.min(100 - imgHeight, y)),
            imgWidth,
            imgHeight,
            dataUrl,
          );
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    this.saveHistory(this.annotations());

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: tool,
      page: pageNum,
      x: Math.max(0, Math.min(100 - width, x)),
      y: Math.max(0, Math.min(100 - height, y)),
      width,
      height,
      color: tool === 'highlight' ? '#ffd500' : '#141b2b',
      fontSize: 16,
      fontFamily: 'IBM Plex Sans Arabic',
      fontWeight: '400',
      textAlign: 'right',
      content: tool === 'text' ? 'نص جديد' : undefined,
      opacity: tool === 'highlight' ? 0.35 : 1,
    };

    this.annotations.update((list) => [...list, newAnnotation]);
    this.selectedAnnotation.set(newAnnotation);
    this.hasUnsavedChanges.set(true);

    // Switch back to select tool
    this.activeTool.set('select');
  }

  /** Drag over handler for image drop */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /** Handle drop events for images */
  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const dt = event.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;
    const file = dt.files[0];
    if (!file.type.startsWith('image/')) return;

    // Find the page element under the drop point if possible
    const target =
      (event.target as HTMLElement) ||
      (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement);
    const pageEl = target?.closest('.page') as HTMLElement | null;
    const pageNum = pageEl
      ? parseInt(pageEl.getAttribute('data-page-number') || '1', 10)
      : this.currentPage();

    const rect = pageEl
      ? pageEl.getBoundingClientRect()
      : ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect);
    const dropX = event.clientX - rect.left;
    const dropY = event.clientY - rect.top;

    const x = (dropX / rect.width) * 100;
    const y = (dropY / rect.height) * 100;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Create a reasonable default size for dropped images
      const imgWidth = 30;
      const imgHeight = 20;
      this.createImageAnnotation(
        pageNum,
        Math.max(0, Math.min(100 - imgWidth, x)),
        Math.max(0, Math.min(100 - imgHeight, y)),
        imgWidth,
        imgHeight,
        dataUrl,
      );
    };
    reader.readAsDataURL(file);
  }

  private createImageAnnotation(
    page: number,
    x: number,
    y: number,
    width: number,
    height: number,
    dataUrl: string,
  ): void {
    this.saveHistory(this.annotations());
    const ann: Annotation = {
      id: crypto.randomUUID(),
      type: 'image',
      page,
      x,
      y,
      width,
      height,
      color: '#000000',
      content: dataUrl,
      opacity: 1,
    };
    this.annotations.update((list) => [...list, ann]);
    this.selectedAnnotation.set(ann);
    this.hasUnsavedChanges.set(true);
  }

  /** Select an existing annotation */
  selectAnnotation(annotation: Annotation): void {
    this.selectedAnnotation.set(annotation);
    this.activeTool.set('select');
  }

  /** Delete the selected annotation */
  deleteSelected(): void {
    const selected = this.selectedAnnotation();
    if (!selected) return;

    this.saveHistory(this.annotations());

    this.annotations.update((list) => list.filter((a) => a.id !== selected.id));
    this.selectedAnnotation.set(null);
    this.hasUnsavedChanges.set(true);
  }

  // ─── Layer & Ordering Operations ────────────────────────────────

  onOrderChanged(direction: 'forward' | 'backward'): void {
    const selected = this.selectedAnnotation();
    if (!selected) return;

    this.saveHistory(this.annotations());

    this.annotations.update((list) => {
      const index = list.findIndex((a) => a.id === selected.id);
      if (index === -1) return list;

      const newList = [...list];
      if (direction === 'forward') {
        if (index < newList.length - 1) {
          const temp = newList[index];
          newList[index] = newList[index + 1];
          newList[index + 1] = temp;
        }
      } else {
        if (index > 0) {
          const temp = newList[index];
          newList[index] = newList[index - 1];
          newList[index - 1] = temp;
        }
      }
      return newList;
    });

    this.hasUnsavedChanges.set(true);
  }

  // ─── Mode Toggles ──────────────────────────────────────────────

  setMode(mode: 'view' | 'edit' | 'annotate'): void {
    this.currentMode.set(mode);
    if (mode === 'view') {
      this.activeTool.set('select');
      this.selectedAnnotation.set(null);
      this.isPropertiesPanelOpen.set(false);
    } else if (mode === 'edit') {
      this.activeTool.set('select');
      this.isPropertiesPanelOpen.set(true);
    } else if (mode === 'annotate') {
      this.activeTool.set('text');
      this.isPropertiesPanelOpen.set(true);
    }
  }

  // ─── Undo / Redo History ───────────────────────────────────────

  private saveHistory(prevList: Annotation[]): void {
    this.undoStack.push([...prevList.map((a) => ({ ...a }))]);
    this.redoStack = [];
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const prev = this.undoStack.pop()!;
    this.redoStack.push([...this.annotations().map((a) => ({ ...a }))]);
    this.annotations.set(prev);
    this.selectedAnnotation.set(null);
    this.hasUnsavedChanges.set(true);
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop()!;
    this.undoStack.push([...this.annotations().map((a) => ({ ...a }))]);
    this.annotations.set(next);
    this.selectedAnnotation.set(null);
    this.hasUnsavedChanges.set(true);
  }

  // ─── Page Creation ──────────────────────────────────────────────

  async addNewPage(): Promise<void> {
    try {
      const bytes = this.pdfBytes();
      if (!bytes) return;

      this.showStatus('جاري إضافة صفحة جديدة...');

      const pdfDoc = await PDFDocument.load(bytes);
      pdfDoc.addPage([595.27, 841.89]); // Standard A4 in PDF points

      const modifiedBytes = await pdfDoc.save();
      this.pdfBytes.set(modifiedBytes);
      this.pdfSrc.set(new Uint8Array(modifiedBytes));

      this.totalPages.update((c) => c + 1);
      this.currentPage.set(this.totalPages());
      this.hasUnsavedChanges.set(true);
      this.showStatus('تم إضافة صفحة جديدة بنجاح');
    } catch (err) {
      console.error('[PdfEditor] Add page failed:', err);
      this.showStatus('فشل إضافة صفحة جديدة');
    }
  }

  async createBlankDocument(): Promise<void> {
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.27, 841.89]);
      const bytes = await pdfDoc.save();
      this.pdfBytes.set(bytes);
      this.pdfSrc.set(bytes);
      this.fileName.set('Elm_Document.pdf');
      this.annotations.set([]);
      this.isDocumentLoaded.set(true);
      this.hasUnsavedChanges.set(true);
      this.showStatus('تم إنشاء مستند جديد');
    } catch (err) {
      console.error('[PdfEditor] Create blank document failed:', err);
      this.showStatus('فشل إنشاء المستند الجديد');
    }
  }

  // ─── Zoom Controls ─────────────────────────────────────────────

  zoomIn(): void {
    this.zoom.update((z) => Math.min(z + 15, 300));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(z - 15, 30));
  }

  zoomReset(): void {
    this.zoom.set(100);
  }

  // ─── Sidebar Toggles ───────────────────────────────────────────

  toggleSidebar(): void {
    this.isSidebarOpen.update((v) => !v);
  }

  togglePropertiesPanel(): void {
    this.isPropertiesPanelOpen.update((v) => !v);
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update((v) => !v);
    if (this.isMobileSidebarOpen()) this.isMobilePropsOpen.set(false);
  }

  toggleMobileProps(): void {
    this.isMobilePropsOpen.update((v) => !v);
    if (this.isMobilePropsOpen()) this.isMobileSidebarOpen.set(false);
  }

  // ─── Overlay Rendering Logic (DOM) ──────────────────────────────

  renderAnnotations(): void {
    if (!this.isDocumentLoaded()) return;

    const pageNum = this.currentPage();
    const pageEl = document.querySelector(`.page[data-page-number="${pageNum}"]`) as HTMLElement;
    if (!pageEl) {
      return;
    }

    let layer = pageEl.querySelector('.elm-annotation-layer') as HTMLElement;
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'elm-annotation-layer';
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
      layer.style.width = '100%';
      layer.style.height = '100%';
      layer.style.zIndex = '10';
      pageEl.appendChild(layer);
    }

    layer.style.pointerEvents = this.currentMode() === 'view' ? 'none' : 'auto';
    layer.innerHTML = '';

    const pageAnns = this.annotations().filter((a) => a.page === pageNum);
    const selectedId = this.selectedAnnotation()?.id;

    pageAnns.forEach((ann) => {
      const annEl = document.createElement('div');
      annEl.className = `annotation-overlay ${ann.type}`;
      if (selectedId === ann.id) {
        annEl.classList.add('selected');
      }

      annEl.style.left = `${ann.x}%`;
      annEl.style.top = `${ann.y}%`;
      annEl.style.width = `${ann.width}%`;
      annEl.style.height = `${ann.height}%`;
      annEl.style.opacity = `${ann.opacity ?? 1}`;
      annEl.style.position = 'absolute';

      if (ann.type === 'text') {
        const textSpan = document.createElement('span');
        textSpan.className = 'annotation-text';
        textSpan.style.fontSize = `${ann.fontSize || 16}px`;
        textSpan.style.fontFamily = ann.fontFamily || 'IBM Plex Sans Arabic';
        textSpan.style.fontWeight = ann.fontWeight || '400';
        textSpan.style.color = ann.color || '#141b2b';
        textSpan.style.textAlign = ann.textAlign || 'right';
        textSpan.style.direction = 'rtl';
        textSpan.textContent = ann.content || '';
        // Allow inline editing like Word when not in view mode
        const editable = this.currentMode() !== 'view';
        textSpan.contentEditable = String(editable);

        // When the user types, update the annotation content immediately
        textSpan.addEventListener('input', () => {
          const newText = textSpan.textContent || '';
          this.annotations.update((list) =>
            list.map((a) => (a.id === ann.id ? { ...a, content: newText } : a)),
          );
          // Update selectedAnnotation reference to the latest object
          const updated = this.annotations().find((a) => a.id === ann.id) || null;
          this.selectedAnnotation.set(updated);
          this.hasUnsavedChanges.set(true);
          this.scheduleAutoSave();
        });

        // Focus when selected so typing is seamless
        if (selectedId === ann.id && editable) {
          setTimeout(() => {
            try {
              textSpan.focus();
              // place caret at the end
              const range = document.createRange();
              range.selectNodeContents(textSpan);
              range.collapse(false);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
            } catch {
              console.warn('Failed to focus annotation text');
            }
          }, 50);
        }

        annEl.appendChild(textSpan);
      } else if (ann.type === 'highlight') {
        const highlightDiv = document.createElement('div');
        highlightDiv.className = 'annotation-highlight';
        highlightDiv.style.width = '100%';
        highlightDiv.style.height = '100%';
        highlightDiv.style.background = ann.color || 'rgba(255, 213, 0, 0.35)';
        annEl.appendChild(highlightDiv);
      } else if (ann.type === 'shape') {
        const shapeDiv = document.createElement('div');
        shapeDiv.className = 'annotation-shape';
        shapeDiv.style.width = '100%';
        shapeDiv.style.height = '100%';
        shapeDiv.style.border = `2px solid ${ann.color || '#141b2b'}`;
        shapeDiv.style.borderRadius = '4px';
        annEl.appendChild(shapeDiv);
      } else if (ann.type === 'draw') {
        const drawDiv = document.createElement('div');
        drawDiv.className = 'annotation-draw';
        drawDiv.style.width = '100%';
        drawDiv.style.height = '100%';
        drawDiv.style.background = ann.color || '#141b2b';
        drawDiv.style.borderRadius = '50%';
        annEl.appendChild(drawDiv);
      } else if (ann.type === 'image') {
        const img = document.createElement('img');
        img.className = 'annotation-image';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.src = ann.content || '';
        annEl.appendChild(img);
      }

      if (selectedId === ann.id && this.currentMode() !== 'view') {
        const delBtn = document.createElement('button');
        delBtn.className = 'annotation-del-btn';
        delBtn.innerHTML = '<i class="pi pi-trash"></i>';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '-10px';
        delBtn.style.left = '-10px';
        delBtn.style.width = '20px';
        delBtn.style.height = '20px';
        delBtn.style.borderRadius = '50%';
        delBtn.style.background = '#ef4444';
        delBtn.style.color = '#ffffff';
        delBtn.style.border = 'none';
        delBtn.style.cursor = 'pointer';
        delBtn.style.display = 'flex';
        delBtn.style.alignItems = 'center';
        delBtn.style.justifyContent = 'center';
        delBtn.style.fontSize = '10px';
        delBtn.style.zIndex = '30';
        delBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteSelected();
        });
        annEl.appendChild(delBtn);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'annotation-resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '-4px';
        resizeHandle.style.left = '-4px';
        resizeHandle.style.width = '8px';
        resizeHandle.style.height = '8px';
        resizeHandle.style.background = '#630ed4';
        resizeHandle.style.border = '1px solid #ffffff';
        resizeHandle.style.cursor = 'nesw-resize';
        resizeHandle.style.zIndex = '30';
        this.setupResizeHandler(resizeHandle, ann, annEl, pageEl);
        annEl.appendChild(resizeHandle);
      }

      annEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentMode() !== 'view') {
          this.selectAnnotation(ann);
        }
      });

      this.setupDragHandler(annEl, ann, pageEl);
      layer.appendChild(annEl);
    });
  }

  private setupDragHandler(annEl: HTMLElement, ann: Annotation, pageEl: HTMLElement): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startAnnX = ann.x;
    let startAnnY = ann.y;

    annEl.addEventListener('mousedown', (e) => {
      if (this.currentMode() === 'view' || this.activeTool() !== 'select') return;
      if (
        (e.target as HTMLElement).closest('.annotation-del-btn') ||
        (e.target as HTMLElement).closest('.annotation-resize-handle')
      )
        return;

      e.stopPropagation();
      e.preventDefault();

      this.selectAnnotation(ann);

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startAnnX = ann.x;
      startAnnY = ann.y;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const pageRect = pageEl.getBoundingClientRect();
        const dxPercent = (dx / pageRect.width) * 100;
        const dyPercent = (dy / pageRect.height) * 100;

        const newX = Math.max(0, Math.min(100 - ann.width, startAnnX + dxPercent));
        const newY = Math.max(0, Math.min(100 - ann.height, startAnnY + dyPercent));

        annEl.style.left = `${newX}%`;
        annEl.style.top = `${newY}%`;

        ann.x = newX;
        ann.y = newY;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        this.saveHistory(this.annotations());

        this.annotations.update((list) =>
          list.map((a) => (a.id === ann.id ? { ...a, x: ann.x, y: ann.y } : a)),
        );
        this.hasUnsavedChanges.set(true);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private setupResizeHandler(
    handle: HTMLElement,
    ann: Annotation,
    annEl: HTMLElement,
    pageEl: HTMLElement,
  ): void {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = ann.width;
    let startHeight = ann.height;
    let startXPos = ann.x;

    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = ann.width;
      startHeight = ann.height;
      startXPos = ann.x;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const pageRect = pageEl.getBoundingClientRect();
        const dxPercent = (dx / pageRect.width) * 100;
        const dyPercent = (dy / pageRect.height) * 100;

        const newWidth = Math.max(2, startWidth - dxPercent);
        const newX = Math.max(0, startXPos + dxPercent);
        const newHeight = Math.max(2, startHeight + dyPercent);

        annEl.style.width = `${newWidth}%`;
        annEl.style.height = `${newHeight}%`;
        annEl.style.left = `${newX}%`;

        ann.width = newWidth;
        ann.x = newX;
        ann.height = newHeight;
      };

      const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        this.saveHistory(this.annotations());

        this.annotations.update((list) =>
          list.map((a) =>
            a.id === ann.id ? { ...a, width: ann.width, height: ann.height, x: ann.x } : a,
          ),
        );
        this.hasUnsavedChanges.set(true);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // ─── Canvas to PNG text renderer for PDF-Lib ────────────────────

  private async textToPngBytes(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
  color: string,
  textAlign: string
): Promise<Uint8Array> {
  // 1. إنشاء عنصر Canvas مؤقت
  const canvas = document.createElement('canvas');

  // لضمان وضوح النص عالي الدقة (High-DPI) وعدم بكسلته داخل الـ PDF
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');

  // تنظيف المساحة وجعلها شفافة
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // تطبيق الـ Scale لتكبير الرسم تلقائياً دون إعادة حساب الإحداثيات
  ctx.scale(scale, scale);

  // 2. ضبط الخط بالصيغة القياسية الصارمة للـ Canvas (تأكد من وجود px)
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = color || '#000000';

  // 3. الحل السحري: ضبط الـ Baseline والـ Direction لدعم العربي
  ctx.textBaseline = 'top'; // تجعل النص يبدأ من الحافة العلوية للصندوق لضمان ظهوره
  ctx.direction = 'rtl';    // تفعيل توجيه النصوص العربية

  // ضبط المحاذاة الأفقية
  ctx.textAlign = textAlign as CanvasTextAlign;

  // 4. تحديد إحداثي X بناءً على نوع المحاذاة المحددة للـ Annotation
  let x = 0;
  if (textAlign === 'right') {
    x = width; // إذا كان محاذاة لليمين، نقطة الارتكاز هي أقصى عرض الصندوق
  } else if (textAlign === 'center') {
    x = width / 2;
  } else {
    x = 0;
  }

  // 5. رسم النص عند y = 0 بأمان لأن الـ Baseline أصبح top
  ctx.fillText(text, x, 0);

  // 6. تحويل الـ Canvas إلى مصفوفة البايتات (الكود الخاص بك)
  const dataUrl = canvas.toDataURL('image/png');
  const base64Data = dataUrl.split(',')[1];
  const binaryStr = window.atob(base64Data);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return bytes;
}

  // ─── PDF-Lib Save Integration ───────────────────────────────────

  private async applyAnnotations(): Promise<Uint8Array> {
    const source = this.pdfBytes();
    if (!source) throw new Error('No PDF loaded');

    const pdfDoc = await PDFDocument.load(source);
    const pages = pdfDoc.getPages();

    for (const annotation of this.annotations()) {
      const pageIndex = annotation.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      const x = (annotation.x / 100) * pageWidth;
      const y =
        pageHeight - (annotation.y / 100) * pageHeight - (annotation.height / 100) * pageHeight;
      const width = (annotation.width / 100) * pageWidth;
      const height = (annotation.height / 100) * pageHeight;

      switch (annotation.type) {
        case 'text':
          if (annotation.content) {
            try {
              // Convert text to high-res PNG to bypass PDF Arabic font issues
              const pngBytes = await this.textToPngBytes(
                annotation.content,
                width,
                height,
                annotation.fontSize || 16,
                annotation.fontFamily || 'IBM Plex Sans Arabic',
                annotation.fontWeight || '400',
                annotation.color || '#000000',
                annotation.textAlign || 'right',
              );
              const pngImage = await pdfDoc.embedPng(pngBytes);
              page.drawImage(pngImage, {
                x,
                y,
                width,
                height,
              });
            } catch (err) {
              console.error('Error drawing text to PDF page:', err);
            }
          }
          break;

        case 'highlight':
          page.drawRectangle({
            x,
            y,
            width,
            height,
            color: this.hexToRgb(annotation.color || '#ffd500'), // حماية بقيمة افتراضية
            opacity: 0.35,
          });
          break;

        case 'shape':
          page.drawRectangle({
            x,
            y,
            width,
            height,
            borderColor: this.hexToRgb(annotation.color || '#141b2b'),
            borderWidth: 2,
            opacity: annotation.opacity ?? 1,
          });
          break;

        case 'draw':
          page.drawCircle({
            x: x + width / 2,
            y: y + height / 2,
            size: Math.min(width, height) / 2,
            color: this.hexToRgb(annotation.color || '#000000'),
            opacity: annotation.opacity ?? 1,
          });
          break;

        case 'image':
          if (annotation.content && annotation.content.startsWith('data:')) {
            try {
              const base64 = annotation.content.split(',')[1];
              const bytes = this.base64ToBytes(base64);
              // Try PNG first, fallback to JPG
              let img;
              if (annotation.content.includes('image/png')) {
                img = await pdfDoc.embedPng(bytes);
              } else {
                img = await pdfDoc.embedJpg(bytes);
              }
              page.drawImage(img, { x, y, width, height });
            } catch (err) {
              console.error('Error embedding image annotation:', err);
            }
          }
          break;

        default:
          break;
      }
    }

    return pdfDoc.save();
  }

  private hexToRgb(hex: string): ReturnType<typeof rgb> {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  private showStatus(msg: string): void {
    this.statusMessage.set(msg);
    setTimeout(() => this.statusMessage.set(null), 3000);
  }

  get currentPageAnnotations(): Annotation[] {
    return this.annotations().filter((a) => a.page === this.currentPage());
  }

  // دالة مساعدة لرسم النصوص متعددة الأسطر داخل الـ Canvas
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
}
