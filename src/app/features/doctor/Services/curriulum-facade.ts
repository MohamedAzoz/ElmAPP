import { Injectable, signal } from '@angular/core';
import { CurriulumPublicClient, GetCurriculumDto } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class CurriulumFacade {
  constructor(private curriulumService: CurriulumPublicClient) {}
  curriulums = signal<GetCurriculumDto[]>([]);
  isLoading = signal<boolean>(false);

  getCurriulumByUserId(userId: string) {
    this.isLoading.set(true);
    this.curriulums.set([]);

    return this.curriulumService.byDoctorId(userId).subscribe({
      next: (res) => {
        this.curriulums.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.curriulums.set([]);
        this.isLoading.set(false);
      },
    });
  }
}
