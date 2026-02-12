import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { SubjectFacade } from '../../Services/subject-facade';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { AddSubjectCommand, UpdateSubjectCommand } from '../../../../../../core/api/clients';
import { RouterLink } from '@angular/router';
import { PrimengadminModule } from '../../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../../core/Services/direction';

@Component({
  selector: 'app-get-all-subjects-for-admin',
  standalone: true,
  imports: [RouterLink, PrimengadminModule],
  providers: [ConfirmationService],
  templateUrl: './get-all-subjects-for-admin.html',
  styleUrl: './get-all-subjects-for-admin.scss',
})
export class GetAllSubjectsForAdmin {
  public facade = inject(SubjectFacade);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  dir = inject(DirectionService);
  displayDialog = signal(false);
  isEditMode = signal(false);

  rows = signal(10);
  first = signal(1);

  subjectForm = { id: 0, name: '', code: '' };
  constructor() {
    effect(() => {
      this.facade.getAllSubjects(this.rows(), this.first());
    });
  }

  loadSubjects(event: any) {
    const pageNumber = event.first / event.rows + 1;
    const pageSize = event.rows;
    this.facade.getAllSubjects(pageSize, pageNumber);
  }

  openAddDialog() {
    this.isEditMode.set(false);
    this.subjectForm = { id: 0, name: '', code: '' };
    this.displayDialog.set(true);
  }

  openEditDialog(subject: any) {
    this.isEditMode.set(true);
    this.subjectForm = { ...subject };
    this.displayDialog.set(true);
  }

  saveSubject() {
    if (!this.subjectForm.name || !this.subjectForm.code) return;

    if (this.isEditMode()) {
      const updateSubjectCommand: UpdateSubjectCommand = {
        id: this.subjectForm.id,
        name: this.subjectForm.name,
        code: this.subjectForm.code,
      };
      this.facade.updateSubject(updateSubjectCommand).subscribe(() => {
        this.onSuccess('تم تحديث بيانات المادة');
      });
    } else {
      const addSubjectCommand: AddSubjectCommand = {
        name: this.subjectForm.name,
        code: this.subjectForm.code,
      };
      this.facade.addSubject(addSubjectCommand).subscribe(() => {
        this.onSuccess('تم إضافة المادة بنجاح');
      });
    }
  }

  confirmDelete(id: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذه المادة؟ سيؤثر ذلك على كافة المناهج المرتبطة بها.',
      accept: () => {
        this.facade.deleteSubject(id).subscribe(() => {
          this.facade.getAllSubjects();
          this.messageService.add({ severity: 'info', summary: 'تم الحذف' });
        });
      },
    });
  }

  private onSuccess(msg: string) {
    this.displayDialog.set(false);
    this.facade.getAllSubjects(10, 1);
    this.messageService.add({ severity: 'success', summary: 'نجاح', detail: msg });
  }
}
