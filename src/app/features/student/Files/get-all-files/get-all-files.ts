import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurriulumFacade } from '../../Curriulums/curriulum-facade';
import { FileCarde } from '../../../../shared/Components/file-carde/file-carde';
import { FileFacade } from '../file-facade';
import { ActivatedRoute } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';
@Component({
  selector: 'app-get-all-files',
  imports: [FileCarde, Skeleton],
  templateUrl: './get-all-files.html',
  styleUrl: './get-all-files.css',
})
export class GetAllFiles {
  curriulumFacade = inject(CurriulumFacade);
  private fileFacade = inject(FileFacade);
  private active = inject(ActivatedRoute);

  private lastLoadedId = signal<number | null>(null);

  files = computed(() => this.fileFacade.files());
  curriulum = computed(() => this.curriulumFacade.curriulum());
  isLoadingColleges = computed(() => this.curriulumFacade.isCurriulumLoading());

  private curriculumId = computed(() => Number(this.active.snapshot.paramMap.get('curriculumId')));

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (!id || this.lastLoadedId() === id) return;

      this.lastLoadedId.set(id);
      this.curriulumFacade.getCurriulum(id);
      this.fileFacade.getFileMetadata(id);
    });
  }
}
