import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurriulumFacade } from '../../Services/curriulum-facade';
import { MessageService } from 'primeng/api';
// PrimeNG
import {
  AddCurriculumCommand,
  ResultOfCurriculumDto,
  UpdateCurriculumCommand,
  UpdateDateCurriculumCommand,
} from '../../../../../../core/api/clients';
import { CollegeFacade } from '../../../Colleges/Services/college-facade';
import { YearFacade } from '../../../Year/Services/year-facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { DepartmentFacade } from '../../../Department/Services/department-facade';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-get-all-curriulums-for-admin',
  imports: [
    ButtonModule,
    DialogModule,
    TableModule,
    SelectModule,
    TagModule,
    ToggleButtonModule,
    InputNumberModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './get-all-curriulums-for-admin.html',
  styleUrl: './get-all-curriulums-for-admin.css',
})
export class GetAllCurriulumsForAdmin {
  public curriculumFacade = inject(CurriulumFacade);
  public departmentFacade = inject(DepartmentFacade);
  public collegeFacade = inject(CollegeFacade);
  public yearFacade = inject(YearFacade); // لجلب المستويات
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  subjectId = computed(() => Number(this.params()?.get('subjectId')));
  displayDialog = signal(false);
  selectedCollegeId = signal<number | null>(null);
  rows = signal(10);
  first = signal(1);
  isEditMode = signal(false);
  isEditDateMode = signal(false);

  constructor() {
    effect(() => {
      if (this.subjectId() !== null) {
        this.curriculumFacade.getCurriculums(this.subjectId(), this.rows(), this.first());
      }
    });
    effect(() => {
      if (this.selectedCollegeId() !== null) {
        this.yearFacade.getAllYears(this.selectedCollegeId()!);
        this.departmentFacade.getDepartmentsByCollege(this.selectedCollegeId()!);
      }
    });
  }

  loadCurriculums(event: any) {
    const pageNumber = event.first / event.rows + 1;
    const pageSize = event.rows;
    this.curriculumFacade.getCurriculums(this.subjectId(), pageSize, pageNumber);
  }

  // نموذج الربط
  curriculumForm = {
    id: 0,
    departmentId: 0,
    yearId: 0,
    doctorId: 0,
    startMonth: 9,
    endMonth: 2,
  };

  togglePublish(id: number) {
    this.curriculumFacade.isPublish(id).subscribe({
      next: () => {
        this.onSuccess('تم تفعيل المادة بنجاح');
      },
      error: (error: any) => {
        this.onError('حدث خطأ أثناء تفعيل المادة');
      },
    });
  }
  edit(curriulum: UpdateCurriculumCommand) {
    this.isEditDateMode.set(false);
    this.isEditMode.set(true);
    this.curriculumForm = {
      id: curriulum.id,
      departmentId: curriulum.departmentId,
      yearId: curriulum.yearId,
      doctorId: curriulum.doctorId,
      startMonth: this.curriculumForm.startMonth,
      endMonth: this.curriculumForm.endMonth,
    };
    this.collegeFacade.getColleges();
    this.curriculumFacade.getDoctors();
    this.displayDialog.set(true);
  }
  editDate(curriulum: UpdateDateCurriculumCommand) {
    this.isEditDateMode.set(true);
    this.isEditMode.set(true);
    this.curriculumForm = {
      id: curriulum.id,
      departmentId: this.curriculumForm.departmentId,
      yearId: this.curriculumForm.yearId,
      doctorId: this.curriculumForm.doctorId,
      startMonth: curriulum.startMonth,
      endMonth: curriulum.endMonth,
    };
    this.displayDialog.set(true);
  }

  delete(id: number) {
    this.curriculumFacade.deleteCurriculum(id).subscribe({
      next: () => {
        this.onSuccess('تم حذف الربط بنجاح');
      },
      error: (error: any) => {
        this.onError('حدث خطأ أثناء حذف الربط');
      },
    });
  }

  openAddDialog() {
    this.isEditDateMode.set(false);
    this.isEditMode.set(false);
    this.curriculumForm = {
      id: 0,
      departmentId: 0,
      yearId: 0,
      doctorId: 0,
      startMonth: 9,
      endMonth: 2,
    };
    this.collegeFacade.getColleges();
    this.curriculumFacade.getDoctors();
    this.displayDialog.set(true);
  }

  save() {
    if (this.isEditDateMode()) {
      const curriulum: UpdateDateCurriculumCommand = { ...this.curriculumForm };
      this.curriculumFacade.updateDate(curriulum).subscribe({
        next: () => {
          this.displayDialog.set(false);
          this.onSuccess('تم تعديل المادة بنجاح');
        },
        error: (error: any) => {
          this.onError('حدث خطأ أثناء تعديل المادة');
        },
      });
      return;
    }
    if (this.isEditMode()) {
      this.curriculumFacade
        .updateCurriculum({ ...this.curriculumForm, subjectId: this.subjectId() })
        .subscribe({
          next: (res: ResultOfCurriculumDto) => {
            this.displayDialog.set(false);
            this.onSuccess('تم تعديل المادة بنجاح');
          },
          error: (error: any) => {
            this.onError('حدث خطأ أثناء تعديل المادة');
          },
        });
      return;
    }
    const command: AddCurriculumCommand = {
      subjectId: this.subjectId(),
      departmentId: this.curriculumForm.departmentId,
      yearId: this.curriculumForm.yearId,
      doctorId: this.curriculumForm.doctorId,
      startMonth: this.curriculumForm.startMonth,
      endMonth: this.curriculumForm.endMonth,
    };
    this.curriculumFacade.addCurriculum(command).subscribe({
      next: () => {
        this.displayDialog.set(false);
        this.onSuccess('تم حفظ الربط بنجاح');
      },
      error: (error: any) => {
        this.onError('حدث خطأ أثناء حفظ الربط');
      },
    });
  }
  private onSuccess(msg: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'تم الحفظ',
      detail: msg,
    });
    this.curriculumFacade.getCurriculums(this.subjectId());
  }
  private onError(msg: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'خطأ',
      detail: msg,
    });
  }
}
