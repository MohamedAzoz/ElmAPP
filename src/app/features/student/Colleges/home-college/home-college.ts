import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { CollegeFacade } from '../college-facade';
import { ActivatedRoute } from '@angular/router';
import { YearFacade } from '../../Year/year-facade';
import { Skeleton } from 'primeng/skeleton';
import { GlobalService } from '../../../../core/Services/global-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Carde } from '../../../../shared/Components/carde/carde';

@Component({
  selector: 'app-home-college',
  imports: [Skeleton, Carde],
  templateUrl: './home-college.html',
  styleUrl: './home-college.scss',
})
export class HomeCollege implements OnInit {
  private collegeFacade = inject(CollegeFacade);
  private title = inject(GlobalService);
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
  ngOnInit(): void {
    this.title.setTitle('الكليات');
  }
}
