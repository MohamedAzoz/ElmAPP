import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleDriveService } from '../../../services/google-drive.service';
import type { DriveFile, FileSourceResult } from '../../models/editor.models';

@Component({
  selector: 'app-file-source-dialog',
  imports: [FormsModule],
  templateUrl: './file-source-dialog.html',
  styleUrl: './file-source-dialog.css',
})
export class FileSourceDialogComponent {
  private readonly driveService = inject(GoogleDriveService);

  /** Whether dialog is visible */
  isOpen = signal(false);

  /** Current mode: choose source or browse drive files */
  mode = signal<'choose' | 'drive-browse'>('choose');

  /** Drive files list */
  driveFiles = signal<DriveFile[]>([]);

  /** Search query for filtering drive files */
  searchQuery = signal('');

  /** Whether currently loading */
  isLoading = signal(false);

  /** Whether we're in export mode */
  isExportMode = signal(false);

  /** Export file name */
  exportFileName = signal('Elm_Document.pdf');

  /** Result emitter */
  fileSelected = output<FileSourceResult>();

  /** Close dialog emitter */
  closed = output<void>();

  /** Export to drive emitter */
  exportToDrive = output<{ fileName: string; fileId?: string }>();

  /** Whether user is signed into Google Drive */
  get isDriveSignedIn(): boolean {
    return this.driveService.isSignedIn();
  }

  /** Filtered drive files based on search */
  get filteredFiles(): DriveFile[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.driveFiles();
    return this.driveFiles().filter((f) => f.name.toLowerCase().includes(query));
  }

  /** Open dialog in import mode */
  openForImport(): void {
    this.isExportMode.set(false);
    this.mode.set('choose');
    this.isOpen.set(true);
  }

  /** Open dialog in export mode */
  openForExport(fileName: string): void {
    this.isExportMode.set(true);
    this.exportFileName.set(fileName);
    this.mode.set('choose');
    this.isOpen.set(true);
  }

  /** Close dialog */
  close(): void {
    this.isOpen.set(false);
    this.mode.set('choose');
    this.searchQuery.set('');
    this.driveFiles.set([]);
    this.closed.emit();
  }

  /** Choose local file */
  onLocalSelected(): void {
    if (this.isExportMode()) {
      this.fileSelected.emit({ source: 'local' });
      this.close();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        this.fileSelected.emit({ source: 'local', file });
        this.close();
      }
    };
    input.click();
  }

  /** Connect to Google Drive */
  async connectDrive(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.driveService.signIn();
      await this.browseDriveFiles();
    } catch {
      // Error handled in service
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Browse drive files */
  async browseDriveFiles(): Promise<void> {
    this.mode.set('drive-browse');
    this.isLoading.set(true);
    try {
      if (!this.driveService.isSignedIn()) {
        await this.driveService.signIn();
      }
      const files = await this.driveService.listPdfFiles();
      this.driveFiles.set(files);
    } catch {
      // Error handled in service
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Select a drive file for import */
  onDriveFileSelected(file: DriveFile): void {
    if (this.isExportMode()) {
      this.exportToDrive.emit({ fileName: file.name, fileId: file.id });
      this.close();
    } else {
      this.fileSelected.emit({ source: 'drive', driveFile: file });
      this.close();
    }
  }

  /** Export as new file to drive */
  onExportNewToDrive(): void {
    this.exportToDrive.emit({ fileName: this.exportFileName() });
    this.close();
  }

  /** Go back to source chooser */
  goBack(): void {
    this.mode.set('choose');
    this.searchQuery.set('');
  }

  /** Format file size */
  formatSize(size?: string): string {
    if (!size) return '';
    const bytes = parseInt(size, 10);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  /** Format date */
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
