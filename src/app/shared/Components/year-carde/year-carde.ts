import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-year-carde',
  imports: [CardModule, RouterLink, ButtonModule, SkeletonModule],
  templateUrl: './year-carde.html',
  styleUrl: './year-carde.scss',
})
export class YearCarde {
  @Input({ required: true }) year!: any;
  
}
