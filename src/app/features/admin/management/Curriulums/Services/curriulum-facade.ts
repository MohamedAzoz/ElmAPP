import { inject, Injectable, signal } from '@angular/core';
import {
  CurriulumAdminClient,
  CurriulumPublicClient,
  AddCurriculumCommand,
  UpdateCurriculumCommand,
  AuthAdminClient,
  DoctorDto,
} from '../../../../../core/api/clients';
import { finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurriulumFacade {
  private adminClient = inject(CurriulumAdminClient);
  private publicClient = inject(CurriulumPublicClient);
  private doctorClient = inject(AuthAdminClient);

  curriculums = signal<any[]>([]); // سيحمل بيانات المنهج المعروضة
  doctors = signal<DoctorDto[]>([]);
  isLoading = signal<boolean>(false);
  totalCount = signal(0);

  // جلب المناهج (يمكن الفلترة بالقسم أو السنة)
  getCurriculums(subjectId: number, pagesize: number = 10, page: number = 1) {
    this.isLoading.set(true);
    this.adminClient
      .bySubjectId(subjectId, pagesize, page)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.curriculums.set(res.data || []);
          this.totalCount.set(res.data?.length || 0);
        },
        error: () => this.curriculums.set([]),
      });
  }

  // جلب الدكاترة المتاحين للنظام
  getDoctors() {
    this.doctorClient.getAllDoctor().subscribe((res) => {
      this.doctors.set(res.data || []);
    });
  }

  addCurriculum(command: AddCurriculumCommand) {
    return this.adminClient.create(command);
  }

  updateCurriculum(command: UpdateCurriculumCommand) {
    return this.adminClient.update(command);
  }

  deleteCurriculum(id: number) {
    return this.adminClient.delete(id);
  }
}
