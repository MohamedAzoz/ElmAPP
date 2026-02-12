import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { QuestionsBankDto2 } from '../../../core/api/clients';

@Component({
  selector: 'app-questions-bank-carde',
  imports: [CardModule, RouterLink, ButtonModule, SkeletonModule],
  templateUrl: './questions-bank-carde.html',
  styleUrl: './questions-bank-carde.scss',
})
export class QuestionsBankCarde {
  @Input({ required: true }) questionBank!: QuestionsBankDto2;
}
