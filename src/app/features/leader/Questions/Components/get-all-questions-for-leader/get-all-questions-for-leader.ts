import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MenuModule } from 'primeng/menu';
import { SplitButtonModule } from 'primeng/splitbutton';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// Services

// Types
import {
  QuestionsDto2,
  OptionsDto2,
  AddQuestionCommand,
  UpdateQuestionCommand,
  AddQuestionsDto,
  AddOptionCommand,
  UpdateOptionCommand,
} from '../../../../../core/api/clients';
import { OptionFacade } from '../../Services/option-facade';
import { QuestionFacade } from '../../Services/question-facade';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { DirectionService } from '../../../../../core/Services/direction';

interface QuestionType {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-question-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FileUploadModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    AccordionModule,
    CheckboxModule,
    ProgressSpinnerModule,
    MenuModule,
    SplitButtonModule,
    BadgeModule,
    CardModule,
    DividerModule,
    InputGroupModule,
    InputGroupAddonModule,
    TextareaModule,
    SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './get-all-questions-for-leader.html',
  styleUrl: './get-all-questions-for-leader.scss',
})
export class GetAllQuestionForLeader implements OnInit {
  // Dependency Injection
  private questionFacade = inject(QuestionFacade);
  private questionLeaderFacade = inject(QuestionFacade);
  private optionFacade = inject(OptionFacade);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
public dir = inject(DirectionService);
  // Signals
  questions = this.questionFacade.questions;
  isLoading = this.questionFacade.isLoading;

  // Local Signals
  showAddQuestionDialog = signal(false);
  showBulkAddDialog = signal(false);
  showExcelUploadDialog = signal(false);
  showOptionsDialog = signal(false);
  showAddOptionDialog = signal(false);
  showEditOptionDialog = signal(false);
  isSubmitting = signal(false);
  selectedQuestion = signal<QuestionsDto2 | null>(null);
  expandedRows = signal<{ [key: string]: boolean }>({});
  editingQuestion = signal<QuestionsDto2 | null>(null);
  selectedOption = signal<OptionsDto2 | null>(null);

  // Computed
  totalQuestions = computed(() => this.questions().length);

  // Form Groups
  questionForm!: FormGroup;
  bulkQuestionsForm!: FormGroup;
  optionForm!: FormGroup;

  // Question Bank ID (يأتي من الـ Route)
  private params = toSignal(this.route.paramMap);
  questionBankId = computed(() => Number(this.params()?.get('questionBankId')));

  // Dropdown Options
  questionTypes: QuestionType[] = [
    { label: 'اختيار من متعدد', value: 'MCQ', icon: 'pi pi-list' },
    { label: 'صح أو خطأ', value: 'TrueFalse', icon: 'pi pi-check-circle' },
  ];

  // Menu Items for Add Button
  addMenuItems: MenuItem[] = [
    {
      label: 'إضافة سؤال واحد',
      icon: 'pi pi-plus',
      command: () => this.openAddQuestionDialog(),
    },
    {
      label: 'إضافة مجموعة أسئلة',
      icon: 'pi pi-plus-circle',
      command: () => this.openBulkAddDialog(),
    },
    {
      label: 'رفع ملف Excel',
      icon: 'pi pi-file-excel',
      command: () => this.openExcelUploadDialog(),
    },
    {
      separator: true,
    },
    {
      label: 'تحميل نموذج Excel',
      icon: 'pi pi-download',
      command: () => this.downloadExcelTemplate(),
    },
  ];

  ngOnInit(): void {
    this.initForms();
    this.loadQuestions();
  }

  private initForms(): void {
    // Single Question Form
    this.questionForm = this.fb.group({
      id: [null],
      content: ['', [Validators.required, Validators.minLength(5)]],
      questionType: ['MCQ', Validators.required],
      options: this.fb.array([]),
    });

    // Bulk Questions Form
    this.bulkQuestionsForm = this.fb.group({
      questions: this.fb.array([]),
    });

    // Option Form
    this.optionForm = this.fb.group({
      id: [null],
      content: ['', [Validators.required, Validators.minLength(1)]],
      isCorrect: [false],
      questionId: [null],
    });

    // Add initial empty question for bulk add
    this.addBulkQuestion();
  }

  // Options Form Array Getters
  get optionsArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  get bulkQuestionsArray(): FormArray {
    return this.bulkQuestionsForm.get('questions') as FormArray;
  }

  // Load Questions
  loadQuestions(): void {
    if (!this.questionBankId()) return;

    this.questionFacade.getQuestionsByBankId(this.questionBankId());
  }

  // ========== Single Question Operations ==========

  openAddQuestionDialog(): void {
    this.editingQuestion.set(null);
    this.questionForm.reset({ questionType: 'MCQ' });
    this.optionsArray.clear();
    this.addOption(); // Add 2 default options for MCQ
    this.addOption();
    this.showAddQuestionDialog.set(true);
  }

  openEditQuestionDialog(question: QuestionsDto2): void {
    this.editingQuestion.set(question);
    this.questionForm.patchValue({
      id: question.id,
      content: question.content,
      questionType: question.questionType,
    });

    this.optionsArray.clear();
    question.options?.forEach((opt) => {
      this.optionsArray.push(
        this.fb.group({
          id: [opt.id],
          content: [opt.content, Validators.required],
          isCorrect: [opt.isCorrect || false],
        }),
      );
    });

    this.showAddQuestionDialog.set(true);
  }

  addOption(): void {
    this.optionsArray.push(
      this.fb.group({
        id: [null],
        content: ['', Validators.required],
        isCorrect: [false],
      }),
    );
  }

  removeOption(index: number): void {
    if (this.optionsArray.length > 2) {
      this.optionsArray.removeAt(index);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يجب أن يحتوي السؤال على خيارين على الأقل',
      });
    }
  }

  saveQuestion(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.questionForm.value;

    if (this.editingQuestion()) {
      // Update existing question
      const updateCommand: UpdateQuestionCommand = {
        id: formValue.id,
        content: formValue.content,
        questionType: formValue.questionType,
      };

      this.questionLeaderFacade.updateQuestion(updateCommand).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم تحديث السؤال بنجاح',
          });
          this.showAddQuestionDialog.set(false);
          this.loadQuestions();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في تحديث السؤال',
          });
        },
        complete: () => this.isSubmitting.set(false),
      });
    } else {
      // Add new question AddQuestionCommand

      const addCommand: AddQuestionsDto = {
        content: formValue.content,
        questionType: formValue.questionType,
        questionBankId: this.questionBankId,
        options: formValue.options.map((opt: any) => ({
          content: opt.content,
          isCorrect: opt.isCorrect,
        })),
      };

      const Command: AddQuestionCommand = {
        questionBankId: this.questionBankId(),
        questionsDto: addCommand,
      };

      this.questionLeaderFacade.addQuestion(Command).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم إضافة السؤال بنجاح',
          });
          this.showAddQuestionDialog.set(false);
          this.loadQuestions();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في إضافة السؤال',
          });
        },
        complete: () => this.isSubmitting.set(false),
      });
    }
  }

  deleteQuestion(question: QuestionsDto2): void {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف السؤال "${question.content?.substring(0, 50)}..."؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.questionLeaderFacade.deleteQuestion(question.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم حذف السؤال بنجاح',
            });
            this.loadQuestions();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: 'فشل في حذف السؤال',
            });
          },
        });
      },
    });
  }

  // ========== Bulk Questions Operations ==========

  openBulkAddDialog(): void {
    this.bulkQuestionsArray.clear();
    this.addBulkQuestion();
    this.showBulkAddDialog.set(true);
  }

  addBulkQuestion(): void {
    const questionGroup = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(5)]],
      questionType: ['MCQ', Validators.required],
      options: this.fb.array([
        this.fb.group({ content: ['', Validators.required], isCorrect: [false] }),
        this.fb.group({ content: ['', Validators.required], isCorrect: [false] }),
      ]),
    });
    this.bulkQuestionsArray.push(questionGroup);
  }

  removeBulkQuestion(index: number): void {
    if (this.bulkQuestionsArray.length > 1) {
      this.bulkQuestionsArray.removeAt(index);
    }
  }

  getBulkQuestionOptions(questionIndex: number): FormArray {
    return this.bulkQuestionsArray.at(questionIndex).get('options') as FormArray;
  }

  addBulkQuestionOption(questionIndex: number): void {
    this.getBulkQuestionOptions(questionIndex).push(
      this.fb.group({ content: ['', Validators.required], isCorrect: [false] }),
    );
  }

  removeBulkQuestionOption(questionIndex: number, optionIndex: number): void {
    const options = this.getBulkQuestionOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
    }
  }

  saveBulkQuestions(): void {
    if (this.bulkQuestionsForm.invalid) {
      this.bulkQuestionsForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    this.isSubmitting.set(true);
    const questions: AddQuestionsDto[] = this.bulkQuestionsArray.value.map((q: any) => ({
      content: q.content,
      questionType: q.questionType,
      options: q.options,
    }));

    this.questionLeaderFacade.addRingToQuestion(this.questionBankId(), questions).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: `تم إضافة ${questions.length} سؤال بنجاح`,
        });
        this.showBulkAddDialog.set(false);
        this.loadQuestions();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في إضافة الأسئلة',
        });
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  // ========== Excel Operations ==========

  openExcelUploadDialog(): void {
    this.showExcelUploadDialog.set(true);
  }

  onExcelUpload(event: any): void {
    const file = event.files[0];
    if (!file) return;

    this.questionLeaderFacade.uploadExcel(this.questionBankId(), file).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم رفع الأسئلة من ملف Excel بنجاح',
        });
        this.showExcelUploadDialog.set(false);
        this.loadQuestions();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في رفع ملف Excel',
        });
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  downloadExcelTemplate(): void {
  this.questionLeaderFacade.exportTemplate(this.questionBankId()).subscribe({
    next: (response: HttpResponse<Blob>) => { // الـ response هنا هو الـ Blob نفسه
      if (response.body) {
        const url = window.URL.createObjectURL(response.body);
        const link = document.createElement('a');
        link.href = url;
        
        // حدد اسم الملف يدوياً أو استخرجه من الهيدر (سنحدده يدوياً للتبسيط)
        link.download = 'questions_template.xlsx';
        
        link.click();
        
        // تنظيف الذاكرة
        window.URL.revokeObjectURL(url);
        link.remove();

        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم تحميل نموذج Excel بنجاح',
        });
      }
    },
    error: (err) => {
      console.error('Download Error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'خطأ',
        detail: 'فشل في تحميل النموذج من السيرفر',
      });
    },
  });
}
  // ========== Options Operations ==========

  openOptionsDialog(question: QuestionsDto2): void {
    this.selectedQuestion.set(question);
    this.showOptionsDialog.set(true);
  }

  openAddOptionDialog(): void {
    this.selectedOption.set(null);
    this.optionForm.reset({
      isCorrect: false,
      questionId: this.selectedQuestion()?.id,
    });
    this.showAddOptionDialog.set(true);
  }

  openEditOptionDialog(option: OptionsDto2): void {
    this.selectedOption.set(option);
    this.optionForm.patchValue({
      id: option.id,
      content: option.content,
      isCorrect: option.isCorrect,
      questionId: this.selectedQuestion()?.id,
    });
    this.showEditOptionDialog.set(true);
  }

  saveOption(): void {
    if (this.optionForm.invalid) {
      this.optionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.optionForm.value;

    if (this.selectedOption()) {
      // Update option
      const updateCommand: UpdateOptionCommand = {
        optionId: formValue.id,
        content: formValue.content,
        isCorrect: formValue.isCorrect,
      };

      this.optionFacade.updateOption(updateCommand).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم تحديث الإجابة بنجاح',
          });
          this.showEditOptionDialog.set(false);
          this.loadQuestions();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في تحديث الإجابة',
          });
        },
        complete: () => this.isSubmitting.set(false),
      });
    } else {
      // Add option
      const addCommand: AddOptionCommand = {
        content: formValue.content,
        isCorrect: formValue.isCorrect,
        questionId: this.selectedQuestion()?.id!,
      };

      this.optionFacade.addOption(addCommand).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم إضافة الإجابة بنجاح',
          });
          this.showAddOptionDialog.set(false);
          this.loadQuestions();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في إضافة الإجابة',
          });
        },
        complete: () => this.isSubmitting.set(false),
      });
    }
  }

  deleteOption(option: OptionsDto2): void {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف هذه الإجابة؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.optionFacade.deleteOption(option.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم حذف الإجابة بنجاح',
            });
            this.loadQuestions();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: 'فشل في حذف الإجابة',
            });
          },
        });
      },
    });
  }

  // ========== Helper Methods ==========

  getQuestionTypeLabel(type: string | undefined): string {
    return this.questionTypes.find((t) => t.value === type)?.label || type || '';
  }

  getQuestionTypeIcon(type: string | undefined): string {
    return this.questionTypes.find((t) => t.value === type)?.icon || 'pi pi-question';
  }

  getQuestionTypeSeverity(
    type: string | undefined,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (type) {
      case 'MCQ':
        return 'info';
      case 'TrueFalse':
        return 'success';
      case 'ShortAnswer':
        return 'warn';
      case 'Essay':
        return 'secondary';
      default:
        return 'info';
    }
  }
}
