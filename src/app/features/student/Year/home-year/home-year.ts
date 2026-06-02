import { Component, effect, inject, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DepartmentFacade } from '../../Department/department-facade';
import { YearFacade } from '../year-facade';
import { Skeleton } from 'primeng/skeleton';
import { toSignal } from '@angular/core/rxjs-interop';
import { Carde } from '../../../../shared/Components/carde/carde';

@Component({
  selector: 'app-home-year',
  imports: [Skeleton, Carde],
  templateUrl: './home-year.html',
  styleUrl: './home-year.css',
})
export class HomeYear {
  private departmentFacade = inject(DepartmentFacade);
  private yearFacade = inject(YearFacade);
  private active = inject(ActivatedRoute);

  private lastLoadedId = signal<number | null>(null);
  private params = toSignal(this.active.paramMap);
  private yearId = computed(() => Number(this.params()?.get('yearId')));

  departments = this.departmentFacade.departments;
  year = this.yearFacade.year;
  isLoadingColleges = this.yearFacade.isYearLoading;

  constructor() {
    effect(() => {
      const id = this.yearId();
      if (!id || this.lastLoadedId() === id) return;
      this.lastLoadedId.set(id);
      this.yearFacade.getYearById(id);
      this.departmentFacade.getDepartments(id);
    });
  }
}
