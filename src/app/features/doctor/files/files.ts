import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FileFacade } from '../../student/Files/file-facade';
import { FileCarde } from '../../../shared/Components/file-carde/file-carde';
import { CurriulumFacade } from '../../student/Curriulums/curriulum-facade';

@Component({
  selector: 'app-files',
  imports: [FileCarde, ProgressSpinnerModule],
  templateUrl: './files.html',
  styleUrl: './files.css',
})
export class Files {
  private fileFacade = inject(FileFacade);
  private curriulumFacade = inject(CurriulumFacade);
  private route = inject(ActivatedRoute);

  files = this.fileFacade.files;
  isFileLoading = this.fileFacade.isFileLoading;

  private params = toSignal(this.route.paramMap);

  private curriculumId = computed(() => Number(this.params()?.get('curriculumId')));

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (id) {
        this.curriulumFacade.getCurriulum(id);
        this.fileFacade.getFileMetadata(id);
      }
    });
  }
}
