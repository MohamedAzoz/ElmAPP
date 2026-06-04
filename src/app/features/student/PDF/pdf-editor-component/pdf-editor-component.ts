import { Component, inject, signal, viewChild, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, effect } from '@angular/core';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import { EditorToolbarComponent } from './components/toolbar/editor-toolbar';
import { PageThumbnailsComponent } from './components/page-thumbnails/page-thumbnails';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel';
import { FileSourceDialogComponent } from './components/file-source-dialog/file-source-dialog';
import { GoogleDriveService } from '../services/google-drive.service';
import type {
  EditorTool,
  Annotation,
  ElementProperties,
  FileSourceResult,
} from './models/editor.models';

@Component({
  selector: 'app-pdf-editor-component',
  imports: [
    NgxExtendedPdfViewerModule,
    EditorToolbarComponent,
    PageThumbnailsComponent,
    PropertiesPanelComponent,
    FileSourceDialogComponent,
  ],
  templateUrl: './pdf-editor-component.html',
  styleUrl: './pdf-editor-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly driveService = inject(GoogleDriveService);

  /** Reference to the file source dialog */
  fileDialog = viewChild<FileSourceDialogComponent>('fileDialog');

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

  /** Google Drive file ID (if imported from Drive) */
  currentDriveFileId = signal<string | null>(null);

  /** Whether the document has unsaved changes */
  hasUnsavedChanges = signal(false);

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

      // Schedule rendering outside current microtask to ensure DOM is updated
      setTimeout(() => this.renderAnnotations(), 20);
    });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  ngOnInit(): void {
    this.driveService.init().catch(() => {});
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
              (node) => node instanceof HTMLElement && (node.classList.contains('page') || node.querySelector('.page'))
            );
            if (addedPages) {
              shouldRender = true;
              break;
            }
          }
          if (m.type === 'attributes' && m.target instanceof HTMLElement && m.target.classList.contains('page')) {
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
  }

  // ─── File Operations ────────────────────────────────────────────

  /** Open the file source dialog for importing */
  openFile(): void {
    this.fileDialog()?.openForImport();
  }

  /** Open the file source dialog for exporting */
  exportFile(): void {
    this.fileDialog()?.openForExport(this.fileName());
  }

  /** Handle file selection from dialog */
  async onFileSelected(result: FileSourceResult): Promise<void> {
    try {
      if (result.source === 'local' && result.file) {
        await this.loadLocalFile(result.file);
      } else if (result.source === 'drive' && result.driveFile) {
        await this.loadDriveFile(result.driveFile.id, result.driveFile.name);
      } else if (result.source === 'local' && !result.file) {
        // Export to local
        await this.exportToLocal();
      }
    } catch (err) {
      console.error('[PdfEditor] File operation failed:', err);
      this.showStatus('حدث خطأ أثناء العملية');
    }
  }

  /** Handle export to Drive */
  async onExportToDrive(event: { fileName: string; fileId?: string }): Promise<void> {
    try {
      const bytes = await this.applyAnnotations();
      if (event.fileId) {
        await this.driveService.updateFile(event.fileId, bytes);
        this.showStatus('تم تحديث الملف في Drive');
      } else {
        const newId = await this.driveService.uploadFile(event.fileName, bytes);
        this.currentDriveFileId.set(newId);
        this.showStatus('تم رفع الملف إلى Drive');
      }
      this.hasUnsavedChanges.set(false);
    } catch {
      this.showStatus('فشل التصدير إلى Drive');
    }
  }

  /** Load a local file via FileReader */
  private async loadLocalFile(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    this.pdfBytes.set(bytes);
    this.pdfSrc.set(bytes);
    this.fileName.set(file.name);
    this.currentDriveFileId.set(null);
    this.isDocumentLoaded.set(true);
    this.annotations.set([]);
    this.hasUnsavedChanges.set(false);
    this.showStatus('تم فتح الملف بنجاح');
  }

  /** Load a file from Google Drive */
  private async loadDriveFile(fileId: string, name: string): Promise<void> {
    this.showStatus('جاري التحميل من Drive...');
    const buffer = await this.driveService.downloadFile(fileId);
    const bytes = new Uint8Array(buffer);
    this.pdfBytes.set(bytes);
    this.pdfSrc.set(bytes);
    this.fileName.set(name);
    this.currentDriveFileId.set(fileId);
    this.isDocumentLoaded.set(true);
    this.annotations.set([]);
    this.hasUnsavedChanges.set(false);
    this.showStatus('تم فتح الملف من Drive');
  }

  /** Export to local device */
  async exportToLocal(): Promise<void> {
    try {
      const modifiedBytes = await this.applyAnnotations();
      const blob = new Blob([modifiedBytes as any], { type: 'application/pdf' });
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

  /** Save — either to Drive (if connected) or local */
  async save(): Promise<void> {
    if (this.currentDriveFileId()) {
      try {
        const bytes = await this.applyAnnotations();
        await this.driveService.updateFile(this.currentDriveFileId()!, bytes);
        this.hasUnsavedChanges.set(false);
        this.showStatus('تم الحفظ في Drive');
      } catch {
        this.showStatus('فشل الحفظ');
      }
    } else {
      await this.exportToLocal();
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

    this.annotations.update((list) =>
      list.map((a) => (a.id === selected.id ? updated : a))
    );
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
      if ((e.target as HTMLElement).closest('.annotation-del-btn') || (e.target as HTMLElement).closest('.annotation-resize-handle')) return;

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
          list.map((a) => (a.id === ann.id ? { ...a, x: ann.x, y: ann.y } : a))
        );
        this.hasUnsavedChanges.set(true);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private setupResizeHandler(handle: HTMLElement, ann: Annotation, annEl: HTMLElement, pageEl: HTMLElement): void {
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
            a.id === ann.id ? { ...a, width: ann.width, height: ann.height, x: ann.x } : a
          )
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
    widthPx: number, 
    heightPx: number, 
    fontSize: number, 
    fontFamily: string, 
    fontWeight: string, 
    color: string, 
    textAlign: string
  ): Promise<Uint8Array> {
    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = widthPx * scale;
    canvas.height = heightPx * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.scale(scale, scale);

    ctx.font = `${fontWeight === '700' ? 'bold' : 'normal'} ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';

    let x = 0;
    if (textAlign === 'right') {
      ctx.textAlign = 'right';
      x = widthPx;
    } else if (textAlign === 'center') {
      ctx.textAlign = 'center';
      x = widthPx / 2;
    } else {
      ctx.textAlign = 'left';
      x = 0;
    }

    const y = heightPx / 2;
    ctx.fillText(text, x, y);

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
      const y = pageHeight - ((annotation.y / 100) * pageHeight) - ((annotation.height / 100) * pageHeight);
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
                annotation.color,
                annotation.textAlign || 'right'
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
            color: this.hexToRgb(annotation.color),
            opacity: 0.35,
          });
          break;

        case 'shape':
          page.drawRectangle({
            x,
            y,
            width,
            height,
            borderColor: this.hexToRgb(annotation.color),
            borderWidth: 2,
            opacity: annotation.opacity ?? 1,
          });
          break;

        case 'draw':
          page.drawCircle({
            x: x + width / 2,
            y: y + height / 2,
            size: Math.min(width, height) / 2,
            color: this.hexToRgb(annotation.color),
            opacity: annotation.opacity ?? 1,
          });
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
}
