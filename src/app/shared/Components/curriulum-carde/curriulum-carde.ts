import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { GetCurriculumDto } from '../../../core/api/clients';

@Component({
  selector: 'app-curriulum-carde',
  imports: [CardModule, RouterLink, ButtonModule, SkeletonModule],
  templateUrl: './curriulum-carde.html',
  styleUrl: './curriulum-carde.scss',
})
export class CurriulumCarde {
  @Input({ required: true }) curriculum!: GetCurriculumDto;
}
