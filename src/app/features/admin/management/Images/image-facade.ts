import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import { ImageAdminClient } from '../../../../core/api/clients';
import { FileParameter } from '../../../../core/api/file-parameter';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ImageFacade {
  private http = inject(HttpClient);
  private imageClient = inject(ImageAdminClient);

  // رابط العرض المباشر
  public imageUrl = `${environment.apiUrl}api/ImagePublic/ShowImageFromUrl`;

  showImage(storageName: string): Observable<Blob> {
    // السر هنا: { responseType: 'blob' }
    return this.http.get(`${this.imageUrl}/${storageName}`, { responseType: 'blob' });
  }

  uploadImage(file: File, collegeId: number) {
    const fileParam: FileParameter = { data: file, fileName: file.name };
    return this.imageClient.uploadCollegeImage(collegeId, fileParam);
  }

  deleteImage(imageName: string) {
    return this.imageClient.deleteImage(imageName);
  }
}
