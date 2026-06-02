import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OneCompilerClient,OneCompilerResponse } from '../../../core/api/clients';


@Injectable({
  providedIn: 'root',
})
export class Compiler {
  private oneCompilerClient = inject(OneCompilerClient);

  // تحويل اللغات إلى الامتدادات الصحيحة لملفات OneCompiler
  private getFileExtension(language: string): string {
    switch (language.toLowerCase()) {
      case 'cpp':
        return 'cpp';
      case 'python':
        return 'py';
      case 'java':
        return 'java';
      case 'csharp':
        return 'cs';
      case 'typescript':
        return 'ts';
      default:
        return 'txt';
    }
  }
  // إرسال الكود واستلام النتيجة فوراً (طلب واحد مباشر)
  executeCode(language: string, code: string): Observable<OneCompilerResponse> {
    // تجهيز جسم الطلب حسب المواصفات الرسمية لـ OneCompiler
    const payload = {
      language: language.toLowerCase(),
      files: [
        {
          name: `main.${this.getFileExtension(language)}`,
          content: code,
        },
      ],
    };

    return this.oneCompilerClient.run(payload);
  }
}
