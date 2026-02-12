import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurriulumFacade } from '../../Services/curriulum-facade';
import { MessageService } from 'primeng/api';
// PrimeNG
import { AddCurriculumCommand } from '../../../../../../core/api/clients';
import { CollegeFacade } from '../../../Colleges/Services/college-facade';
import { YearFacade } from '../../../Year/Services/year-facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { DepartmentFacade } from '../../../Department/Services/department-facade';
import { PrimengadminModule } from '../../../../../../shared/Models/primengadmin/primengadmin-module';

@Component({
  selector: 'app-get-all-curriulums-for-admin',
  imports: [PrimengadminModule],
  templateUrl: './get-all-curriulums-for-admin.html',
  styleUrl: './get-all-curriulums-for-admin.scss',
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
  };

  delete(id: number) {
    this.curriculumFacade.deleteCurriculum(id).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'تم الحذف',
        detail: 'تم حذف الربط بنجاح',
      });
    });
  }

  openAddDialog() {
    this.curriculumForm = { id: 0, departmentId: 0, yearId: 0, doctorId: 0 };
    this.collegeFacade.getColleges();
    this.curriculumFacade.getDoctors();
    this.displayDialog.set(true);
  }

  save() {
    const command: AddCurriculumCommand = {
      subjectId: this.subjectId(),
      departmentId: this.curriculumForm.departmentId,
      yearId: this.curriculumForm.yearId,
      doctorId: this.curriculumForm.doctorId,
    };
    console.log(command);
    this.curriculumFacade.addCurriculum(command).subscribe({
      next: () => {
        this.displayDialog.set(false);
        this.curriculumFacade.getCurriculums(this.subjectId());
        this.messageService.add({
          severity: 'success',
          summary: 'تم الحفظ',
          detail: 'تم حفظ الربط بنجاح',
        });
      },
      error: (error: any) => {
        console.log(error);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'حدث خطأ أثناء حفظ الربط',
        });
      },
    });
  }
}
