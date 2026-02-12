import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { YearFacade } from '../../Services/year-facade';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { toSignal } from '@angular/core/rxjs-interop';
import { PrimengadminModule } from '../../../../../../shared/Models/primengadmin/primengadmin-module';

@Component({
  selector: 'app-get-all-years-for-admin',
  imports: [PrimengadminModule],
  providers: [ConfirmationService],
  templateUrl: './get-all-years-for-admin.html',
  styleUrl: './get-all-years-for-admin.scss',
})
export class GetAllYearsForAdmin implements OnInit {
  public yearFacade = inject(YearFacade);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private collegeId = computed(() => Number(this.params().get('collegeId')));
  displayDialog = signal(false);
  isEditMode = signal(false);
  // نموذج البيانات للديالوج
  yearForm = { id: 0, name: '' };

  ngOnInit() {
    this.loadYears();
  }

  loadYears() {
    this.yearFacade.getAllYears(this.collegeId());
  }

  openAddDialog() {
    this.isEditMode.set(false);
    this.yearForm = { id: 0, name: '' };
    this.displayDialog.set(true);
  }

  openEditDialog(year: any) {
    this.isEditMode.set(true);
    this.yearForm = { id: year.id, name: year.name };
    this.displayDialog.set(true);
  }

  saveYear() {
    if (!this.yearForm.name.trim()) return;

    if (this.isEditMode()) {
      this.yearFacade.updateYear(this.yearForm.id, this.yearForm.name).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم تحديث المستوى بنجاح',
        });
        this.closeDialog();
      });
    } else {
      this.yearFacade.addYear(this.yearForm.name, this.collegeId()).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم إضافة المستوى بنجاح',
        });
        this.closeDialog();
      });
    }
  }

  confirmDelete(id: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا المستوى؟ سيؤدي ذلك لحذف البيانات المرتبطة به.',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.yearFacade.deleteYear(id).subscribe(() => {
          this.messageService.add({
            severity: 'info',
            summary: 'تم الحذف',
            detail: 'تم إزالة المستوى',
          });
          this.loadYears();
        });
      },
    });
  }

  private closeDialog() {
    this.displayDialog.set(false);
    this.loadYears();
  }
}
