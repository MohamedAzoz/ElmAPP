import { Component, Input, effect, input } from '@angular/core';
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
  name!: string;
  url!: string;
  constructor() {
    effect(() => {
      this.name = this.data().name ?? this.data().subjectName ?? '';
      this.url =
        (this.Link() || '').trim() !== ''
          ? `${this.data().id}/${this.Link()}`
          : (this.data().id?.toString() ?? '');
    });
  }
}
