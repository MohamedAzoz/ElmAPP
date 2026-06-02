import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DepartmentFacade } from '../department-facade';
import { Skeleton } from 'primeng/skeleton';
import { CurriulumFacade } from '../../Curriulums/curriulum-facade';
import { YearFacade } from '../../Year/year-facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { Carde } from '../../../../shared/Components/carde/carde';

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
        if (!dId || (this.lastLoadedId()?.dId === dId && this.lastLoadedId()?.yId === yId)) return;
        this.lastLoadedId.set({ dId, yId });
        this.yearFacade.getYearById(yId);
        this.departmentFacade.getDepartmentById(dId);
        this.curriulumFacade.getAllCurriulums(dId, yId);
      }
    });
  }
}
