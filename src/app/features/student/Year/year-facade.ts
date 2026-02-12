import { Injectable, signal } from '@angular/core';
import { GetYearDto, YearPublicClient } from '../../../core/api/clients';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class YearFacade {
  years = signal<GetYearDto[]>([]);
  year = signal<GetYearDto>({});
  yearId = signal<number>(0);
  isYearLoading = signal<boolean>(false);

  constructor(private yearPublic: YearPublicClient) {}
  getAllYears(collegeId: number) {
    return this.yearPublic.getAllYears(collegeId).subscribe({
      next: (res) => {
        this.years.set(res.data || []);
        this.isYearLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.years.set([]);
        this.isYearLoading.set(false);
      },
    });
  }
  getYearById(id: number) {
    return this.yearPublic.getYearById(id).subscribe({
      next: (res) => {
        const data = res.data;
        if (data !== null && data !== undefined) {
          this.year.set(data || {});
          this.yearId.set(data.id!);
          this.isYearLoading.set(false);
        }
      },
      error: () => {
        this.year.set({});
        this.yearId.set(0);
        this.isYearLoading.set(false);
      },
    });
  }
}
