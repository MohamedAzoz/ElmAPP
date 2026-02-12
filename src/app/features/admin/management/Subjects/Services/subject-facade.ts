import { inject, Injectable, signal } from '@angular/core';
import {
  AddSubjectCommand,
  GetSubjectDto,
  SubjectAdminClient,
  SubjectPublicClient,
  UpdateSubjectCommand,
} from '../../../../../core/api/clients';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SubjectFacade {
  private adminClient = inject(SubjectAdminClient);

  subjects = signal<GetSubjectDto[]>([]);
  totalCount = signal<number>(0); // إجمالي عدد المواد
  isLoading = signal<boolean>(false);

  getAllSubjects(pagesize: number = 10, page: number = 1) {
    this.isLoading.set(true);
    this.adminClient
      .getAllSubjects(pagesize, page)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.subjects.set(res.data || []);
          this.totalCount.set(res.data?.length || 0);
        },
        error: () => {
          this.subjects.set([]);
          this.totalCount.set(0);
        },
      });
  }

  // بقية الدوال (add, update, delete) تبقى كما هي...
  addSubject(addsubject: AddSubjectCommand) {
    return this.adminClient.addSubject(addsubject);
  }
  updateSubject(updatesubject: UpdateSubjectCommand) {
    return this.adminClient.updateSubject(updatesubject);
  }
  deleteSubject(subjectId: number) {
    return this.adminClient.deleteSubject(subjectId);
  }
}
