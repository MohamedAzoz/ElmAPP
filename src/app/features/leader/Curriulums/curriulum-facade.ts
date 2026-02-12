import { Injectable, signal } from '@angular/core';
import { CurriulumPublicClient, GetCurriculumDto } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class CurriulumFacade {
  curriulums = signal<GetCurriculumDto[]>([]);
  curriulum = signal<GetCurriculumDto | null>(null);
  constructor(private universityPublic: CurriulumPublicClient) {}

  getCurriulumsByStudentId(id: string) {
    return this.universityPublic.byStudentId(id).subscribe({
      next: (res) => {
        this.curriulums.set(res.data || []);
      },
      error: (err) => {
        this.curriulums.set([]);
        console.log(err);
      },
    });
  }
}
