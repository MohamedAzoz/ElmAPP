import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DepartmentFacade } from '../department-facade';
import { Skeleton } from 'primeng/skeleton';
import { CurriulumFacade } from '../../Curriulums/curriulum-facade';
import { YearFacade } from '../../Year/year-facade';
import { Carde } from '../../../../shared/Components/carde/carde';
import { StudentAuthService } from '../../../../core/Services/student-auth.service';

@Component({
  selector: 'app-home-department',
  imports: [Skeleton, Carde],
  templateUrl: './home-department.html',
  styleUrl: './home-department.css',
})
export class HomeDepartment {
  departmentFacade = inject(DepartmentFacade);
  curriulumFacade = inject(CurriulumFacade);
  private yearFacade = inject(YearFacade);
  private router = inject(Router);
  private studentAuth = inject(StudentAuthService);

  private lastLoadedId = signal<{ dId: number; yId: number } | null>(null);

  constructor() {
    effect(() => {
      const nav = this.router.getCurrentNavigation();
      const state = nav?.extras.state || window.history.state;
      let yId = state?.academicYear;
      let dId = state?.department;

      if (!yId || !dId) {
        const profile = this.studentAuth.studentProfile();
        if (profile) {
          yId = yId || profile.academicYear;
          dId = dId || profile.department;
        }
      }

      if (dId && yId) {
        if (this.lastLoadedId()?.dId === dId && this.lastLoadedId()?.yId === yId) return;
        this.lastLoadedId.set({ dId, yId });
        this.yearFacade.getYearById(yId);
        this.departmentFacade.getDepartmentById(dId);
        this.curriulumFacade.getAllCurriulums(dId, yId);
      }
    });
  }
}
