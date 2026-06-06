import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { LinkValidatorFacade } from '../link-validator-facade';
import { LinkSourceType, SOURCE_TYPE_OPTIONS, STATUS_CONFIG, SavedLink } from '../link.model';

@Component({
  selector: 'app-security-link-validator',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
  ],
  templateUrl: './security-link-validator.html',
  styleUrl: './security-link-validator.css',
})
export class SecurityLinkValidator implements OnInit {
  facade = inject(LinkValidatorFacade);

  // Constants for template
  readonly SOURCE_TYPE_OPTIONS = [...SOURCE_TYPE_OPTIONS];
  readonly STATUS_CONFIG = STATUS_CONFIG as any;
  // Modal State
  showAddModal = signal(false);

  // Form State
  newLinkTitle = signal('');
  newLinkUrl = signal('');
  newLinkSourceType = signal<LinkSourceType>(LinkSourceType.external);

  // Edit State
  editingLinkId = signal<string | null>(null);

  async ngOnInit() {
    await this.facade.loadLinks();
  }

  // --- Modal Management ---

  openAddModal() {
    this.resetForm();
    this.editingLinkId.set(null);
    this.showAddModal.set(true);
  }

  openEditModal(link: SavedLink) {
    this.newLinkTitle.set(link.title);
    this.newLinkUrl.set(link.url);
    this.newLinkSourceType.set(link.sourceType);
    this.editingLinkId.set(link.id);
    this.showAddModal.set(true);
  }

  closeModal() {
    this.showAddModal.set(false);
    this.resetForm();
  }

  resetForm() {
    this.newLinkTitle.set('');
    this.newLinkUrl.set('');
    this.newLinkSourceType.set(LinkSourceType.external);
    this.editingLinkId.set(null);
    this.facade.clearValidationError();
  }

  // --- Actions ---

  async saveLink() {
    if (!this.newLinkTitle().trim() || !this.newLinkUrl().trim()) {
      return;
    }

    const isEditing = this.editingLinkId();
    let success = false;

    if (isEditing) {
      success = await this.facade.updateLink(
        isEditing,
        this.newLinkTitle(),
        this.newLinkUrl(),
        this.newLinkSourceType(),
      );
    } else {
      success = await this.facade.addLink(
        this.newLinkTitle(),
        this.newLinkUrl(),
        this.newLinkSourceType(),
      );
    }

    if (success) {
      this.closeModal();
    }
  }

  async deleteLink(id: string) {
    await this.facade.deleteLink(id);
  }

  async recheckLink(id: string) {
    await this.facade.recheckLink(id);
  }

  openLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // --- Google Drive Actions ---

  async toggleDriveSync() {
    const status = this.facade.driveStatus();
    if (status === 'connected') {
      this.facade.disconnectFromDrive();
    } else {
      await this.facade.connectToDrive();
    }
  }

  async forceSync() {
    await this.facade.syncToDrive();
  }

  async restoreFromDrive() {
    await this.facade.restoreFromDrive();
  }

  // --- Helpers ---

  getSourceIcon(type: LinkSourceType): string {
    const option = this.SOURCE_TYPE_OPTIONS.find((o) => o.value === type);
    return option ? option.icon : 'pi pi-link';
  }

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }
}
