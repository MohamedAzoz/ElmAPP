import { Injectable, signal } from '@angular/core';
import { FilePublicClient, FileView } from '../../../core/api/clients';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
@Injectable({ providedIn: 'root' })
export class FileFacade {
  files = signal<FileView[]>([]);
  isFileLoading = signal<boolean>(false);
  constructor(
    private filePublicService: FilePublicClient,
    private http: HttpClient,
  ) {}
  // private baseUrl = 'https://elmapi-dgf0aggzbbhjagdk.polandcentral-01.azurewebsites.net'; // رابط السيرفر

  // دالة العرض (حل مشكلة SyntaxError)
  showFile(storageName: string) {
    const url = `${environment.apiUrl}api/FilePublic/ShowFileFromUrl/${storageName}`;

    // نطلب الملف كـ blob مباشرة لنتجنب محاولة NSwag لتحويله لـ JSON
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err) => console.error('فشل في فتح الملف:', err),
    });
  }
  // دالة التحميل (ستكشف لك سبب خطأ 500)
  downloadFile(storageName: string) {
    const url = `${environment.apiUrl}api/FilePublic/DownloadFile/${storageName}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = storageName; // أو الاسم الأصلي للملف
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        console.error(
          'فشل التحميل - السيرفر أرجع خطأ 500. تأكد من وجود الملف في المسار الصحيح على السيرفر.',
        );
      },
    });
  }
  getFileMetadata(curriculumId: number) {
    this.isFileLoading.set(true);
    this.filePublicService.getAllFilesByCurriculumId(curriculumId).subscribe({
      next: (res) => {
        this.files.set(res.data || []);
        this.isFileLoading.set(false);
      },
      error: () => {
        this.files.set([]);
        this.isFileLoading.set(false);
      },
    });
  }
}
