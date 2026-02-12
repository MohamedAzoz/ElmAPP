import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-department-carde',
  imports: [CardModule, RouterLink, ButtonModule, SkeletonModule],
  templateUrl: './department-carde.html',
  styleUrl: './department-carde.scss',
})
export class DepartmentCarde {
  @Input({ required: true }) department!: any;
  @Input({ required: true }) yearId: any;
}
