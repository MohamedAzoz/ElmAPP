import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FilePrivateClient, FilePublicClient, FileView } from '../../../core/api/clients';
import { FileParameter } from '../../../core/api/file-parameter';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class FileFacade {
  private filePrivateService = inject(FilePrivateClient);
  private filePublicService = inject(FilePublicClient);
  private http = inject(HttpClient);

  files = signal<FileView[]>([]);
  isFileLoading = signal<boolean>(false);

  // جلب كافة الملفات لمنهج معين
  getFiles(curriculumId: number) {
    this.isFileLoading.set(true);
    this.filePublicService
      .getAllFilesByCurriculumId(curriculumId)
      .pipe(finalize(() => this.isFileLoading.set(false)))
      .subscribe({
        next: (res) => this.files.set(res.data || []),
        error: () => this.files.set([]),
      });
  }

  uploadFile(
    curriculumId: number,
    uploadedById: string,
    description: string,
    formFile: FileParameter,
  ) {
    const formData = new FormData();
    // this.filePrivateService.uploadFile(curriculumId, uploadedById, description, formFile);
    // تأكد من مطابقة هذه الأسماء لبارامترات الـ C# Controller لديك
    formData.append('curriculumId', curriculumId.toString());
    formData.append('uploadedById', uploadedById);
    formData.append('Description', description);

    // 'file' هو الاسم الافتراضي الذي ينتظره IFormFile في الباك إند
    formData.append('FormFile', formFile.data, formFile.fileName ? formFile.fileName : 'FormFile');

    // المسار الصحيح بناءً على صور الـ Network والـ Logs السابقة
    const url = `${environment.apiUrl}api/private/FilePrivate/UploadFile`;

    // نستخدم HttpClient العادي لتجنب تعقيدات NSwag المولد
    return this.http.post(url, formData);
  }

  // حذف ملف
  deleteFile(fileId: number) {
    return this.filePrivateService.deleteFile(fileId);
  }

  // عرض الملف في نافذة جديدة
  showFile(storageName: string) {
    const url = `${environment.apiUrl}api/FilePublic/ShowFileFromUrl/${storageName}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err) => console.error('فشل في فتح الملف:', err),
    });
  }

  // تحميل الملف للجهاز
  downloadFile(storageName: string) {
    const url = `${environment.apiUrl}api/FilePublic/DownloadFile/${storageName}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = storageName;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => console.error('فشل التحميل:', err),
    });
  }
}
