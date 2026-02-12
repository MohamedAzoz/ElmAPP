import { computed, Injectable, signal } from '@angular/core';
import { CollegePublicClient, GetCollegeDto } from '../../../core/api/clients';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CollegeFacade {
  private _colleges = signal<GetCollegeDto[]>([]);
  colleges = computed(() => this._colleges());
  college = signal<GetCollegeDto | null>(null);
  isLoading = signal<boolean>(false);

  constructor(private collegePublicClient: CollegePublicClient) {}

  getAllColleges(universityId: number) {
    this.isLoading.set(true);

    this.collegePublicClient.getAllColleges(universityId).subscribe({
      next: (res: any) => {
        this._colleges.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this._colleges.set([]);
        this.isLoading.set(false);
      },
    });
  }

  getCollegeById(id: number) {
    this.collegePublicClient.getCollegeById(id).subscribe({
      next: (res) => {
        const data = res?.data || null;
        this.college.set(data);
      },
      error: (err) => {
        this.college.set(null);
      },
    });
  }
}
