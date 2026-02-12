import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
    ConfirmDialogModule
  ],
  exports: [
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    ToastModule,
    CheckboxModule,
    ConfirmDialogModule
  ]
})
export class PrimengModule { }
