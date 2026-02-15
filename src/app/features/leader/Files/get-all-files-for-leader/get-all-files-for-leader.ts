import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FileFacade } from '../file-facade'; // تأكد من المسار
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { DirectionService } from '../../../../core/Services/direction';
import { PrimengModule } from '../../../../shared/Models/primeng/primeng-module';
import { IdentitySignals } from '../../../../core/Auth/services/identity-signals';

@Component({
  selector: 'app-get-all-files-for-leader',
  imports: [
    FormsModule,
    TableModule,
    DialogModule,
    TooltipModule,
    FileUploadModule,
    PrimengModule,
    DatePipe,
    RouterLink,
  ],
  providers: [ConfirmationService],
  templateUrl: './get-all-files-for-leader.html',
  styleUrl: './get-all-files-for-leader.scss',
})
export class GetAllFilesForLeader implements OnInit {
  public facade = inject(FileFacade);
  private route = inject(ActivatedRoute);
  private identity = inject(IdentitySignals);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  public dir = inject(DirectionService);

  curriculumId = 0;
  leaderId = ''; // افتراضياً، يجب جلبه من Auth Service
  displayUploadDialog = signal(false);

  // نموذج الرفع
  uploadForm = {
    description: '',
    file: null as File | null,
  };

  ngOnInit() {
    this.leaderId = this.identity.userId;
    this.curriculumId = Number(this.route.snapshot.paramMap.get('curriculumId'));
    this.loadFiles();
  }

  loadFiles() {
    if (this.curriculumId) {
      this.facade.getFiles(this.curriculumId);
    }
  }

  onFileSelect(event: any) {
    this.uploadForm.file = event.files[0];
  }

  handleUpload() {
    if (!this.uploadForm.file || !this.uploadForm.description) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطأ',
        detail: 'يرجى اختيار ملف وكتابة وصف',
      });
      return;
    }

    const fileParam = {
      data: this.uploadForm.file,
      fileName: this.uploadForm.file.name,
    };

    this.facade
      .uploadFile(this.curriculumId, this.leaderId, this.uploadForm.description, fileParam)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'تم الرفع',
            detail: 'تم إضافة الملخص بنجاح',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في إضافة الملخص',
          });
        },
        complete: () => {
          this.displayUploadDialog.set(false);
          this.uploadForm = { description: '', file: null };
          this.loadFiles();
        },
      });
  }

  confirmDelete(fileId: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا الملخص؟',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade.deleteFile(fileId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'info',
              summary: 'تم الحذف',
              detail: 'تم إزالة الملف',
            });
            this.loadFiles();
          },
        });
      },
    });
  }
}
