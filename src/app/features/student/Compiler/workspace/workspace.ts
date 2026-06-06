import { Component, inject, ChangeDetectorRef } from '@angular/core'; // 👈 1. استيراد الخدمة هنا
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { CommonModule } from '@angular/common';
import { Compiler } from '../compiler';
import { OneCompilerResponse } from '../../../../core/api/clients';

@Component({
  selector: 'app-workspace',
  imports: [MonacoEditorModule, FormsModule, CommonModule],
  templateUrl: './workspace.html',
  styleUrls: ['./workspace.css'],
})
export class Workspace {
  private compilerService = inject(Compiler);
  private cdr = inject(ChangeDetectorRef); // 👈 2. حقن الخدمة داخل المكون

  // الأكواد الافتراضية المجهزة للطلاب عند اختيار اللغة
  private boilerplates: { [key: string]: string } = {
    csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello Elm!");\n    }\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Elm!");\n    }\n}`,
    python: `# مرحباً بك في منصة علم\nprint("Hello from Elm Compiler!")`,
    javascript: `console.log("Hello Elm!");`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "مرحباً بك في منصة علم" << endl;\n    return 0;\n}`,
    php: `<?php\necho "Hello Elm!";\n?>`,
  };
  languages = [
    { id: 'csharp', name: 'C#' },
    { id: 'java', name: 'Java' },
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'cpp', name: 'C++' },
    { id: 'php', name: 'PHP' },
  ];

  selectedLanguage: string = 'cpp';
  code: string = this.boilerplates['cpp'];

  constructor() {
    const state = typeof window !== 'undefined' ? window.history.state : null;
    if (state && state.code) {
      this.code = state.code;
    }
  }

  terminalOutput: string = 'اضغط على زر "تشغيل الكود" لرؤية النتيجة هنا...';
  isCompilerError: boolean = false;
  isLoading: boolean = false;

  editorOptions = {
    theme: 'vs-dark',
    language: 'cpp',
    automaticLayout: true,
    fontSize: 15,
    minimap: { enabled: false },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    lineNumbers: 'on',
    roundedSelection: true,
    scrollBeyondLastLine: false,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    padding: { top: 12, bottom: 12 },
  };

  editorInstance: any;

  initEditor(editor: any) {
    this.editorInstance = editor;
    setTimeout(() => this.editorInstance.layout(), 500);
  }

  onLanguageChange() {
    this.code = this.boilerplates[this.selectedLanguage];
    this.editorOptions = {
      ...this.editorOptions,
      language: this.selectedLanguage,
    };
  }

  // 🚀 تشغيل الكود البرمجي فوري وبدون انتظار دوري
  runCode() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.isCompilerError = false;
    this.terminalOutput = 'جاري إرسال الكود وتشغيله سحابياً...';
    this.cdr.detectChanges(); // 👈 3. تحديث الواجهة فوراً ليظهر نص التحميل واللون الأخضر

    this.compilerService.executeCode(this.selectedLanguage, this.code).subscribe({
      next: (response: OneCompilerResponse) => {
        this.isLoading = false;

        // التحقق من نجاح العملية ومعالجة مخرجات OneCompiler البديهية
        if (response && response.status === 'success') {
          if (response.stderr) {
            this.terminalOutput = response.stderr;
            this.isCompilerError = true;
          } else if (response.exception) {
            this.terminalOutput = response.exception;
            this.isCompilerError = true;
          } else {
            this.terminalOutput =
              response.stdout || 'تم تنفيذ الكود بنجاح (لا توجد مخرجات نصية لعرضها).';
            this.isCompilerError = false;
          }
        } else {
          this.terminalOutput = 'عذراً، فشلت بيئة التشغيل في معالجة الملف.';
          this.isCompilerError = true;
        }

        this.cdr.detectChanges(); // 👈 4. إجبار أنجلر على عرض النتيجة النهائية فوراً وإعادة حالة الزر
      },
      error: (err) => {
        this.isLoading = false;
        this.isCompilerError = true;
        this.terminalOutput =
          'حدث خطأ أثناء الاتصال بـ OneCompiler API. تحقق من صلاحية الحصة المجانية للمفتاح.';
        console.error(err);

        this.cdr.detectChanges(); // 👈 5. إجبار أنجلر على عرض الخطأ في حالة فشل الاتصال بالشبكة
      },
    });
  }
}
