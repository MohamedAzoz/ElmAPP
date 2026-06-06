import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResultOfboolean } from '../../core/api/clients';

/**
 * SupportFacade
 *
 * Accepts real File objects and posts them via multipart/form-data.
 *
 * WHY we bypass the generated SupportsClient:
 *   The generated client sends images[] as base64 strings → Telegram can't
 *   display them. Here we append each File as a real Blob so ASP.NET Core's
 *   IFormFile binding works correctly and Telegram receives actual image files.
 *
 * SUCCESS DETECTION:
 *   The backend returns a 200 OK with a JSON body like:
 *     { data: true, isSuccess: true, statusCode: 200, message: "..." }
 *   OR in some cases it may omit isSuccess / return null.
 *   We rely on the HTTP 2xx status (handled by HttpClient) as the primary
 *   success signal; the component then checks res.isSuccess === false to
 *   detect explicit business-logic failures.
 */
@Injectable({
  providedIn: 'root',
})
export class SupportFacade {
  private http = inject(HttpClient);

  submitError(
    name: string,
    email: string,
    message: string,
    images: File[] = [],
  ): Observable<ResultOfboolean> {
    const url = 'https://elm.runasp.net/api/Supports/submit-error';

    const form = new FormData();
    form.append('Name', name);
    form.append('Email', email);
    form.append('Message', message);

    // Append each file as a real Blob with its original filename + MIME type.
    // Do NOT convert to base64 — the backend and Telegram need actual binary.
    images.forEach((file) => {
      form.append('Images', file, file.name);
    });

    // responseType: 'json' lets Angular parse the body automatically.
    // We do NOT set Content-Type — the browser sets it with the correct
    // multipart boundary when the body is a FormData instance.
    return this.http.post<ResultOfboolean>(url, form, {
      headers: new HttpHeaders({ Accept: 'application/json' }),
    });
  }
}