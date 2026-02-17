import { Component, inject, Input } from '@angular/core';
import { FileView } from '../../../core/api/clients';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { Router, ActivatedRoute } from '@angular/router';
import { FileFacade } from '../../../features/student/Files/file-facade';
import { PermissionFacade } from '../../../core/Auth/services/permission-facade';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-file-carde',
  imports: [CardModule, ButtonModule, SkeletonModule, DatePipe],
  templateUrl: './file-carde.html',
  styleUrl: './file-carde.scss',
})
export class FileCarde {
  @Input({ required: true }) file!: FileView;

  fileFacade = inject(FileFacade);
  permissionFacade = inject(PermissionFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isDoctorView: boolean = this.router.url.includes('doctor');

  show(storageName: string) {
    if (storageName) this.fileFacade.showFile(storageName);
  }

  downLoad(storageName: string) {
    if (storageName) this.fileFacade.downloadFile(storageName);
  }

  goToRate() {
    this.router.navigate(['../rate', this.file.id], { relativeTo: this.route });
  }
}
