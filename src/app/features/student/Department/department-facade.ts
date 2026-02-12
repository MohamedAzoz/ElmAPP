import { Injectable, signal } from '@angular/core';
import {
  DepartmentPublicClient,
  GetDepartmentDto,
  GetDepartmentDto2,
} from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class DepartmentFacade {
  departments = signal<GetDepartmentDto[]>([]);
  department = signal<GetDepartmentDto2 | null>(null);
  isDepartmentLoading = signal<boolean>(false);

  constructor(private departmentPublicClient: DepartmentPublicClient) {}

  getDepartments(yearId: number) {
    return this.departmentPublicClient.getAllDepartments(yearId).subscribe({
      next: (res) => {
        this.departments.set(res.data || []);
        this.isDepartmentLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.departments.set([]);
        this.isDepartmentLoading.set(false);
      },
    });
  }
  getDepartmentById(departmentId: number) {
    return this.departmentPublicClient.getDepartmentById(departmentId).subscribe({
      next: (res) => {
        this.department.set(res.data || null);
        this.isDepartmentLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.department.set(null);
        this.isDepartmentLoading.set(false);
      },
    });
  }
}
