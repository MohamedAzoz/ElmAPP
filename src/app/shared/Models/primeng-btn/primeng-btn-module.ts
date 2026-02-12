import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
  ],
  exports: [
    ButtonModule,
    TooltipModule,
  ]
})
export class PrimengBtnModule { }
