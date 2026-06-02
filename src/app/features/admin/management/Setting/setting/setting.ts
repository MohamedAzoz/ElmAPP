import { Component, inject, OnInit, signal } from '@angular/core';
import { SettingFacade } from '../setting-facade';
import {
  AddSettingsCommand,
  SettingsDto,
  UpdateSettingsCommand,
} from '../../../../../core/api/clients';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-setting',
  imports: [ButtonModule, DialogModule, TableModule, InputTextModule, FormsModule, CommonModule],
  templateUrl: './setting.html',
  styleUrl: './setting.css',
})
export class Setting implements OnInit {
  public settingFacade = inject(SettingFacade);
  private messageService = inject(MessageService);
  isEditMode = signal(false);
  displayDialog = signal(false);
  settingForm = {
    value: '',
    key: '',
  };
  ngOnInit(): void {
    this.settingFacade.getSetting();
  }

  openAddDialog() {
    this.displayDialog.set(true);
    this.isEditMode.set(false);
    this.settingForm = {
      value: '',
      key: '',
    };
  }

  openEditDialog(setting: SettingsDto) {
    this.displayDialog.set(true);
    this.isEditMode.set(true);
    this.settingForm = {
      value: setting.value,
      key: setting.key,
    };
  }

  save() {
    if (this.isEditMode()) {
      this.settingFacade.updateSetting(this.settingForm as UpdateSettingsCommand).subscribe(() => {
        this.onSuccess('تم تحديث الإعداد بنجاح');
      });
    } else {
      this.settingFacade.createSetting(this.settingForm as AddSettingsCommand).subscribe(() => {
        this.onSuccess('تم إضافة الإعداد بنجاح');
      });
    }
    this.displayDialog.set(false);
  }
  private onSuccess(message: string) {
    this.settingFacade.getSetting();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }
}
