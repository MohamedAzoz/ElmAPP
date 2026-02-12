import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DepartmentFacade } from '../../Services/department-facade';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { AddDepartmentCommand, UpdateDepartmentCommand } from '../../../../../../core/api/clients';
import { PrimengadminModule } from '../../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../../core/Services/direction';

@Component({
  selector: 'app-get-all-departments-for-admin',
  imports: [
    PrimengadminModule
  ],
  providers: [ConfirmationService],
  templateUrl: './get-all-departments-for-admin.html',
  styleUrl: './get-all-departments-for-admin.scss',
})
export class GetAllDepartmentsForAdmin {
  public departmentFacade = inject(DepartmentFacade);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private dir = inject(DirectionService);
  params= computed(() => this.route.snapshot.paramMap);
  collegeId = 0;
  displayDialog = signal(false);
  isEditMode = signal(false);
   rows = signal(10);
   first = signal(1);
   constructor() {
    effect(() => {
      this.collegeId = Number(this.params()?.get('collegeId'));
      if(this.collegeId){
        this.departmentFacade.getDepartmentsByCollege(this.collegeId, this.first(), this.rows());
      }
    })
   }
  // Form Model
  deptForm = {
    id: 0,
    name: '',
    isPaid: false,
    type: 0,
  };


  loadDepartments(event: any) {
     const pageNumber = event.first / event.rows + 1;
    const pageSize = event.rows;
    this.departmentFacade.getDepartmentsByCollege(this.collegeId, pageNumber, pageSize);
  }
  
  openAddDialog() {
    this.isEditMode.set(false);
    this.deptForm = { id: 0, name: '', isPaid: false, type: 0 };
    this.displayDialog.set(true);
  }

  openEditDialog(dept: UpdateDepartmentCommand) {
    this.isEditMode.set(true);
    this.deptForm = {
      id: dept.id,
      name: dept.name,
      isPaid: dept.isPaid,
      type: dept.type || 0,
    };
    this.displayDialog.set(true);
  }

  save() {
    if (this.isEditMode()) {
      const command: UpdateDepartmentCommand = { ...this.deptForm, collegeId: this.collegeId };
      this.departmentFacade.updateDepartment(command).subscribe(() => {
        this.onSuccess('تم تحديث القسم بنجاح');
      });
    } else {
      const command: AddDepartmentCommand = { ...this.deptForm, collegeId: this.collegeId };
      this.departmentFacade.createDepartment(command).subscribe(() => {
        this.onSuccess('تم إضافة القسم الجديد');
      });
    }
  }

  confirmDelete(id: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا القسم؟ قد يؤثر ذلك على الطلاب المسجلين فيه.',
      header: 'تنبيه الحذف',
      icon: 'pi pi-trash',
      accept: () => {
        this.departmentFacade.deleteDepartment(id).subscribe(() => {
          this.messageService.add({ severity: 'info', summary: 'تم الحذف' });
          this.departmentFacade.getDepartmentsByCollege(this.collegeId, this.first(), this.rows());
        });
      },
    });
  }

  private onSuccess(msg: string) {
    this.displayDialog.set(false);
    this.departmentFacade.getDepartmentsByCollege(this.collegeId, this.first(), this.rows());
    this.messageService.add({ severity: 'success', summary: 'نجاح', detail: msg });
  }
}
