import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Skeleton } from 'primeng/skeleton';
import { Carde } from '../../../../shared/Components/carde/carde';
import { DepartmentFacade } from '../../Department/department-facade';
import { SectionFacade } from '../section-facade';

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

  private params = toSignal(this.active.paramMap, {
    initialValue: this.active.snapshot.paramMap,
  });

  private lastLoadedId = signal<{ dId: number; yId: number } | null>(null);
  private departmentId = computed(() => Number(this.params().get('departmentId')));
  private yearId = computed(() => Number(this.params().get('yearId')));

  constructor() {
    effect(() => {
      const dId = this.departmentId();
      const yId = this.yearId();

      if (dId > 0 && yId > 0) {
        if (this.lastLoadedId()?.dId === dId && this.lastLoadedId()?.yId === yId) return;
        this.lastLoadedId.set({ dId, yId });
        this.departmentFacade.getDepartmentById(dId);
        this.sectionFacade.getSectionsByDepartment(dId, yId);
      }
    });
  }
}
