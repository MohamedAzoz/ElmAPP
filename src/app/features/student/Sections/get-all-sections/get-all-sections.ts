import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Skeleton } from 'primeng/skeleton';
import { Carde } from '../../../../shared/Components/carde/carde';
import { DepartmentFacade } from '../../Department/department-facade';
import { SectionFacade } from '../section-facade';
import { StudentAuthService } from '../../../../core/Services/student-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-get-all-sections',
  imports: [Skeleton, Carde],
  templateUrl: './get-all-sections.html',
  styleUrl: './get-all-sections.css',
})
export class GetAllSections {
  departmentFacade = inject(DepartmentFacade);
  sectionFacade = inject(SectionFacade);
  private active = inject(ActivatedRoute);
  private router = inject(Router);
  private studentAuth = inject(StudentAuthService);

  private params = toSignal(this.active.paramMap, {
    initialValue: this.active.snapshot.paramMap,
  });

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
        this.departmentFacade.getDepartmentById(dId);
        this.sectionFacade.getSectionsByDepartment(dId, yId);
      }
    });
  }
}
