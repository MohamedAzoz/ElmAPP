import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router'; // للتنقل بين الصفحات
import { CollegeFacade } from '../../Services/college-facade';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { FileUploadModule } from 'primeng/fileupload';
import { ImageFacade } from '../../../Images/image-facade';
import { GetCollegeDto } from '../../../../../../core/api/clients';
import { PrimengadminModule } from '../../../../../../shared/Models/primengadmin/primengadmin-module';

@Component({
  selector: 'app-get-all-colleges-for-admin',
  imports: [FileUploadModule, RouterLink, PrimengadminModule],
  providers: [ConfirmationService],
  templateUrl: './get-all-colleges-for-admin.html',
  styleUrl: './get-all-colleges-for-admin.scss',
})
export class GetAllCollegesForAdmin implements OnInit {
  public collegeFacade = inject(CollegeFacade);
  public imageFacade = inject(ImageFacade);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  displayCollegeDialog = signal(false);
  displayImageDialog = signal(false);
  isEditMode = signal(false);

  // النموذج
  collegeForm = { id: 0, name: '' };
  selectedCollegeIdForImage = 0;

  ngOnInit() {
    // جلب الكليات فور تحميل الصفحة (الـ ID يتم جلبه داخلياً من الـ Facade)
    this.collegeFacade.getColleges();
  }

  // --- إدارة الكليات ---
  openAddDialog() {
    this.isEditMode.set(false);
    this.collegeForm = { id: 0, name: '' };
    this.displayCollegeDialog.set(true);
  }

  openEditDialog(college: GetCollegeDto) {
    this.isEditMode.set(true);
    this.collegeForm = { id: college.id!, name: college.name! };
    this.displayCollegeDialog.set(true);
  }

  saveCollege() {
    if (this.isEditMode()) {
      this.collegeFacade
        .updateCollege({ id: this.collegeForm.id, name: this.collegeForm.name })
        .subscribe(() => {
          this.completeAction('تم تحديث بيانات الكلية');
        });
    } else {
      this.collegeFacade.addCollege(this.collegeForm.name).subscribe(() => {
        this.completeAction('تم إضافة الكلية الجديدة بنجاح');
      });
    }
  }

  // --- إدارة الصور (كما في الكود السابق) ---
  openImageDialog(collegeId: number, imageName: string, hasImage: boolean) {
    this.selectedCollegeIdForImage = collegeId;
    if (hasImage) {
      this.confirmationService.confirm({
        message: 'سيتم حذف الصورة الحالية لرفع صورة جديدة، هل أنت متأكد؟',
        accept: () => {
          this.imageFacade.deleteImage(imageName).subscribe(() => {
            this.displayImageDialog.set(true);
          });
        },
      });
    } else {
      this.displayImageDialog.set(true);
    }
  }

  onImageUpload(event: any) {
    const file = event.files[0];
    if (file) {
      this.imageFacade.uploadImage(file, this.selectedCollegeIdForImage).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم تحديث شعار الكلية',
        });
        this.displayImageDialog.set(false);
        this.collegeFacade.getColleges();
      });
    }
  }

  confirmDelete(id: number) {
    this.confirmationService.confirm({
      message: 'حذف الكلية سيؤدي لحذف كافة الأقسام والمستويات المرتبطة بها، هل أنت متأكد؟',
      header: 'تحذير نهائي',
      icon: 'pi pi-trash',
      accept: () => {
        this.collegeFacade.deleteCollege(id).subscribe(() => {
          this.collegeFacade.getColleges();
          this.messageService.add({ severity: 'warn', summary: 'تم الحذف' });
        });
      },
    });
  }

  private completeAction(msg: string) {
    this.displayCollegeDialog.set(false);
    this.collegeFacade.getColleges();
    this.messageService.add({ severity: 'success', summary: 'عملية ناجحة', detail: msg });
  }
}
