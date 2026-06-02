import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';

interface ErrorLog {
  message: string;
  stackTrace?: string;
  url: string;
  timestamp: Date;
  userAgent: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorLogger {
  private http = inject(HttpClient);

  logError(message: string, stackTrace?: string): void {
    const errorLog: ErrorLog = {
      message,
      stackTrace,
      url: window.location.href,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    };

    // Log to console in development
    // if (!environment.production) {
    //   console.group('🔴 Error Log');
    //   console.error('Message:', message);
    //   if (stackTrace) console.error('Stack:', stackTrace);
    //   console.log('URL:', errorLog.url);
    //   console.log('Time:', errorLog.timestamp);
    //   console.groupEnd();
    // }

    // Send to server in production
  //   if (environment.production) {
  //     this.sendToServer(errorLog);
  //   }
  // }

//   private sendToServer(errorLog: ErrorLog): void {
//     // إرسال الخطأ للخادم (يمكن تجاهل الأخطاء هنا)
//     this.http.post(`${environment.apiUrl}/api/logs/errors`, errorLog).subscribe({
//       error: () => {
//         // Silent fail - don't cause infinite loop
//         console.warn('Failed to send error log to server');
//       },
//     });
  }
}

