import { inject, Injectable, signal } from '@angular/core';
import {
  AddYearCommand,
  UpdateYearCommand,
  YearAdminClient,
  YearPublicClient,
  GetYearDto,
} from '../../../../../core/api/clients';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class YearFacade {
  private yearAdmin = inject(YearAdminClient);
  private yearPublic = inject(YearPublicClient);

  // Signals لإدارة الحالة
  years = signal<GetYearDto[]>([]);
  isLoading = signal<boolean>(false);

  getAllYears(collegeId: number) {
    this.isLoading.set(true);
    this.yearPublic
      .getAllYears(collegeId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.years.set(res.data || []),
        error: () => this.years.set([]),
      });
  }

  addYear(name: string, collegeId: number) {
    const command: AddYearCommand = {  name, collegeId };
    return this.yearAdmin.addYear(command);
  }

  updateYear(id: number, name: string) {
    const command: UpdateYearCommand = { id, name };
    return this.yearAdmin.updateYear(command);
  }

  deleteYear(id: number) {
    return this.yearAdmin.deleteYear(id);
  }
}