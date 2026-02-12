import { inject, Injectable, signal } from '@angular/core';
import {
  ResultOfUniversityDetialsDto,
  UniversityDetialsDto,
  UniversityPublicClient,
} from '../../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class UniversityFacade {
  private universityPublic = inject(UniversityPublicClient);
  universityId = signal<number>(3);
  // تعريف الـ Signal
  university = signal<UniversityDetialsDto | null>(null);

  getUniversityByName() {
    this.universityPublic.getUniversit().subscribe({
      next: (res: ResultOfUniversityDetialsDto) => {
        this.university.set(res.data || null);
        this.universityId.set(res.data?.id || 3);
      },
      error: () => this.university.set(null),
    });
  }
}
