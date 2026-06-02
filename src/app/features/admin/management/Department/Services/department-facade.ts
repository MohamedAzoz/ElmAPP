import { inject, Injectable, signal } from '@angular/core';
import {
  AddDepartmentCommand,
  DepartmentAdminClient,
  DepartmentPublicClient,
  UpdateDepartmentCommand,
  DepartmentDto,
} from '../../../../../core/api/clients';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DepartmentFacade {
  private departmentAdmin = inject(DepartmentAdminClient);

  // Signals
  departments = signal<DepartmentDto[]>([]);
  isLoading = signal<boolean>(false);
  totalCount = signal<number>(0);

  // الدالة التي ستعتمد عليها في الإدارة (بناءً على الكلية)
  getDepartmentsByCollege(collegeId: number, pageNumber: number = 1, pageSize: number = 10) {
    this.isLoading.set(true);
    // ملاحظة: استبدل getAllDepartments بـ الميثود الجديد فور إضافته في الباك
    this.departmentAdmin
      .getAllDepartmentsByCollegeId(collegeId, pageNumber, pageSize)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.departments.set(res.data || []);
          this.totalCount.set(res.data?.length || 0);
        },
        error: () => this.departments.set([]),
      });
  }

  createDepartment(command: AddDepartmentCommand) {
    return this.departmentAdmin.createDepartment(command);
  }

  updateDepartment(command: UpdateDepartmentCommand) {
    return this.departmentAdmin.updateDepartment(command);
  }

  deleteDepartment(id: number) {
    return this.departmentAdmin.deleteDepartment(id);
  }
  isPublish(departmentId: number) {
    return this.departmentAdmin.togglePublishDepartment(departmentId);
  }
}
