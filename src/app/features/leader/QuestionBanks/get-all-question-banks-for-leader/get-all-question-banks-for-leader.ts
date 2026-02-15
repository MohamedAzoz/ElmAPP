import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuestionBankFacade } from '../question-bank-facade';
import { toSignal } from '@angular/core/rxjs-interop';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DirectionService } from '../../../../core/Services/direction';

@Component({
  selector: 'app-get-all-question-banks-for-leader',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    RouterLink
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './get-all-question-banks-for-leader.html',
  styleUrl: './get-all-question-banks-for-leader.scss',
})
export class GetAllQuestionBanksForLeader implements OnInit {
  public facade = inject(QuestionBankFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  public dir = inject(DirectionService);

  private params = toSignal(this.route.paramMap);
  curriculumId = computed(() => Number(this.params()?.get('curriculumId')));

  displayDialog = signal(false);
  isEditMode = signal(false);
  bankForm = { id: 0, name: '' };

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (id) this.facade.getQuestionBanks(id);
    });
  }

  ngOnInit() {}

  showAddDialog() {
    this.isEditMode.set(false);
    this.bankForm = { id: 0, name: '' };
    this.displayDialog.set(true);
  }

  showEditDialog(bank: any) {
    this.isEditMode.set(true);
    this.bankForm = { id: bank.id, name: bank.name };
    this.displayDialog.set(true);
  }

  saveBank() {
    if (!this.bankForm.name) return;

    if (this.isEditMode()) {
      this.facade
        .updateQuestionBank({
          id: this.bankForm.id,
          name: this.bankForm.name,
          curriculumId: this.curriculumId(),
        })
        .subscribe(() => {
          this.refreshAndNotify('تم تعديل البنك بنجاح');
        });
    } else {
      this.facade
        .addQuestionBank({
          name: this.bankForm.name,
          curriulumId: this.curriculumId(),
          curriculumId: this.curriculumId(),
        })
        .subscribe(() => {
          this.refreshAndNotify('تم إضافة البنك بنجاح');
        });
    }
  }

  confirmDelete(id: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا البنك نهائياً؟',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade.deleteQuestionBank(id).subscribe(() => {
          this.refreshAndNotify('تم حذف البنك', 'warn');
        });
      },
    });
  }

  addQuestions(bankId: number) {
    // التوجه لصفحة إضافة الأسئلة داخل هذا البنك
    this.router.navigate([bankId], { relativeTo: this.route });
  }

  private refreshAndNotify(msg: string, severity: string = 'success') {
    this.facade.getQuestionBanks(this.curriculumId());
    this.displayDialog.set(false);
    this.messageService.add({ severity, summary: 'عملية ناجحة', detail: msg });
  }
}
