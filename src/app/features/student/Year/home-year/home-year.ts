import { Component, effect, inject, signal } from '@angular/core';
import { DepartmentFacade } from '../../Department/department-facade';
import { YearFacade } from '../year-facade';
import { Skeleton } from 'primeng/skeleton';
import { Carde } from '../../../../shared/Components/carde/carde';
import { StudentAuthService } from '../../../../core/Services/student-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-year',
  imports: [Skeleton, Carde],
  templateUrl: './home-year.html',
  styleUrl: './home-year.css',
})
export class HomeYear {
  private departmentFacade = inject(DepartmentFacade);
  private yearFacade = inject(YearFacade);
  private router = inject(Router);
  private studentAuth = inject(StudentAuthService);

  private lastLoadedId = signal<number | null>(null);

  departments = this.departmentFacade.departments;
  year = this.yearFacade.year;
  isLoadingColleges = this.yearFacade.isYearLoading;

  constructor() {
    effect(() => {
      const nav = this.router.getCurrentNavigation();
      const state = nav?.extras.state || window.history.state;
      let id = state?.academicYear;

      if (!id) {
        const profile = this.studentAuth.studentProfile();
        if (profile) {
          id = profile.academicYear;
        }
      }

      if (!id || this.lastLoadedId() === id) return;
      this.lastLoadedId.set(id);
      this.yearFacade.getYearById(id);
      this.departmentFacade.getDepartments(id);
    });
  }
}
