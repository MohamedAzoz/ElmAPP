import { inject, Injectable, signal } from '@angular/core';
import { 
  UniversityPublicClient, 
  CollegePublicClient, 
  YearPublicClient, 
  DepartmentPublicClient 
} from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class SetProfileFacade {
  private universityClient = inject(UniversityPublicClient);
  private collegeClient = inject(CollegePublicClient);
  private yearClient = inject(YearPublicClient);
  private departmentClient = inject(DepartmentPublicClient);

  colleges = signal<any[]>([]);
  years = signal<any[]>([]);
  departments = signal<any[]>([]);

  selectedCollegeId = signal<number | null>(null);
  selectedYearId = signal<number | null>(null);
  selectedDepartmentId = signal<number | null>(null);

  isLoading = signal<boolean>(false);

  loadInitialData() {
    this.isLoading.set(true);
    this.universityClient.getUniversit().subscribe({
      next: (res: any) => {
        if (res.data && res.data.id) {
          this.loadColleges(res.data.id);
        } else {
            this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  private loadColleges(universityId: number) {
    this.collegeClient.getAllColleges(universityId).subscribe({
      next: (res: any) => {
        this.colleges.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onCollegeChange(collegeId: number) {
    this.selectedCollegeId.set(collegeId);
    this.selectedYearId.set(null);
    this.selectedDepartmentId.set(null);
    this.years.set([]);
    this.departments.set([]);
    
    this.yearClient.getAllYears(collegeId).subscribe({
      next: (res: any) => {
        this.years.set(res.data || []);
      }
    });
  }

  onYearChange(yearId: number) {
    this.selectedYearId.set(yearId);
    this.selectedDepartmentId.set(null);
    this.departments.set([]);

    this.departmentClient.getAllDepartments(yearId).subscribe({
      next: (res: any) => {
        this.departments.set(res.data || []);
      }
    });
  }

  onDepartmentChange(departmentId: number) {
    this.selectedDepartmentId.set(departmentId);
  }
}
