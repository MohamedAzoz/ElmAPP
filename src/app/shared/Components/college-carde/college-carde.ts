import { Component, Input, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { GetCollegeDto } from '../../../core/api/clients';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton'; // استيراد الـ Skeleton

@Component({
  selector: 'app-college-carde',
  standalone: true,
  imports: [CardModule, RouterLink, ButtonModule, SkeletonModule],
  templateUrl: './college-carde.html',
})
export class CollegeCarde {
  @Input({ required: true }) college!: GetCollegeDto;

  // private sanitizer = inject(DomSanitizer);

  // imgUrl = signal<SafeUrl | string | null>(null);
  isImageLoading = signal<boolean>(true); // حالة تحميل الصورة
  // private internalUrl: string | null = null;

  // ngOnInit(): void {
  //   // this.fetchImage();
  // }

  // fetchImage() {
  //   const imageName = this.college.imagName || this.college.imageName;
  //   if (!imageName) {
  //     this.isImageLoading.set(false);
  //     return;
  //   }

  //   this.imageFacade.showImage(imageName).subscribe({
  //     next: (blob) => {
  //       this.internalUrl = URL.createObjectURL(blob);
  //       this.imgUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.internalUrl));
  //       this.isImageLoading.set(false); // انتهى التحميل
  //     },
  //     error: () => {
  //       this.isImageLoading.set(false);
  //     },
  //   });
  // }

  // ngOnDestroy(): void {
  //   // if (this.internalUrl) URL.revokeObjectURL(this.internalUrl);
  // }
}
