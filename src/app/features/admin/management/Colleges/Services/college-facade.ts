import { inject, Injectable, signal } from '@angular/core';
import {
  CollegeAdminClient,
  CollegePublicClient,
  AddCollegeCommand,
  UpdateCollegeCommand,
  GetCollegeDto,
} from '../../../../../core/api/clients';
import { finalize } from 'rxjs';
import { UniversityFacade } from '../../../../student/Universty/uniersty-facade';

@Injectable({ providedIn: 'root' })
export class CollegeFacade {
  private adminClient = inject(CollegeAdminClient);
  private publicClient = inject(CollegePublicClient);
  private universityFacade = inject(UniversityFacade);

  colleges = signal<GetCollegeDto[]>([]);
  isLoading = signal<boolean>(false);
  get universityId() : number {
    if (!this.universityFacade.universityId() || this.universityFacade.universityId() === null) {
      this.universityFacade.getUniversityByName();
    }
    return this.universityFacade.universityId()!;
  }
  // جلب كل الكليات بناءً على رقم الجامعة
  getColleges() {
    this.isLoading.set(true);
    this.publicClient
      .getAllColleges(this.universityId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.colleges.set(res.data || []);
        },
        error: () => this.colleges.set([]),
      });
  }

  addCollege(name: string) {
    const command: AddCollegeCommand = {
      name: name,
      universityId: this.universityId!,
    };
    return this.adminClient.create(command);
  }

  updateCollege(command: UpdateCollegeCommand) {
    return this.adminClient.update(command);
  }

  deleteCollege(id: number) {
    return this.adminClient.delete(id);
  }
}
