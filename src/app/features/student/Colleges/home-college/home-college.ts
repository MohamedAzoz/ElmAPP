import { Component, computed, effect, inject } from '@angular/core';
import { CollegeFacade } from '../college-facade';
import { ActivatedRoute } from '@angular/router';
import { YearFacade } from '../../Year/year-facade';
import { Skeleton } from 'primeng/skeleton';
import { toSignal } from '@angular/core/rxjs-interop';
import { Carde } from '../../../../shared/Components/carde/carde';

@Component({
  selector: 'app-home-college',
  imports: [Skeleton, Carde],
  templateUrl: './home-college.html',
  styleUrl: './home-college.css',
})
export class HomeCollege {
  private collegeFacade = inject(CollegeFacade);
  private yearFacade = inject(YearFacade);
  private active = inject(ActivatedRoute);

  params = toSignal(this.active.paramMap);
  collegeId = computed(() => Number(this.params()?.get('collegeId')));
  college = this.collegeFacade.college;
  years = this.yearFacade.years;
  isLoadingColleges = this.yearFacade.isYearLoading;

  constructor() {
    effect(() => {
      const col = this.collegeId();
      if (col) {
        this.collegeFacade.getCollegeById(col);
        this.yearFacade.getAllYears(col);
      }
    });
  }
}
