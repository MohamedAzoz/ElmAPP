import { Component, Input, effect, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GetCurriculumDto, GetDepartmentDto, GetYearDto } from '../../../core/api/clients';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-carde',
  imports: [RouterLink, Card],
  templateUrl: './carde.html',
  styleUrl: './carde.css',
})
export class Carde {
  data = input.required<GetCurriculumDto | GetDepartmentDto | GetYearDto>();
  Link = input<string>('');
  cardType = input<'default' | 'department' | 'curriculum' | 'section'>('default');
  curriculumId = input<number | null>(null);
  name!: string;
  url!: string;

  icon = computed(() => {
    if (this.cardType() === 'section') {
      const title = (this.name || '').toLowerCase();
      if (
        title.includes('كود') ||
        title.includes('برمج') ||
        title.includes('تتبع') ||
        title.includes('تجرب')
      ) {
        return 'pi pi-flask';
      }
      return 'pi pi-wrench';
    }
    return 'pi pi-box';
  });

  constructor() {
    effect(() => {
      this.name = this.data().name ?? this.data().subjectName ?? this.data().name ?? '';
      this.url =
        (this.Link() || '').trim() !== ''
          ? `${this.data().id}/${this.Link()}`
          : (this.data().id?.toString() ?? '');
    });
  }
}
