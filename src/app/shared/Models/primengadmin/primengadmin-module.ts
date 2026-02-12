import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { Select, SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    ToastModule,
    CheckboxModule,
    SelectModule,
    DialogModule,
    TableModule,
    FormsModule,
    InputNumberModule,
    ToggleButtonModule,
    TagModule,
    ConfirmDialogModule,
    Select,
  ],
  exports: [
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    ToastModule,
    CheckboxModule,
    SelectModule,
    DialogModule,
    TableModule,
    FormsModule,
    InputNumberModule,
    ToggleButtonModule,
    TagModule,
    ConfirmDialogModule,
    Select,
  ],
})
export class PrimengadminModule { }
