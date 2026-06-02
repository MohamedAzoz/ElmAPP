import { Injectable, signal } from '@angular/core';
import { CurriulumPublicClient, GetCurriculumDto, GetCurriculumDto2 } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class CurriulumFacade {
  curriulums = signal<GetCurriculumDto[]>([]);
  curriulum = signal<GetCurriculumDto2 | null>(null);
  isCurriulumLoading = signal<boolean>(false);

  constructor(private curriulumPublicClient: CurriulumPublicClient) {}

  getAllCurriulums(departmentId: number, yearId: number) {
    return this.curriulumPublicClient.getAllByDeptIdAndYearId(departmentId, yearId).subscribe({
      next: (res) => {
        this.curriulums.set(res.data || []);
        this.isCurriulumLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.curriulums.set([]);
        this.isCurriulumLoading.set(false);
      },
    });
  }
  getCurriulum(Id: number) {
    return this.curriulumPublicClient.getById(Id).subscribe({
      next: (res) => {
        this.curriulum.set(res.data || null);
        this.isCurriulumLoading.set(false);
      },
      error: (e) => {
        this.curriulum.set(null);
        this.isCurriulumLoading.set(false);
      },
    });
  }
}
