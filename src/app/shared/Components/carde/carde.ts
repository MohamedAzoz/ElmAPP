import { Component, Input, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GetCurriculumDto, GetDepartmentDto, GetYearDto } from '../../../core/api/clients';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-carde',
  imports: [RouterLink, Card],
  templateUrl: './carde.html',
  styleUrl: './carde.scss',
})
export class Carde {
  @Input({ required: true }) data!: GetCurriculumDto | GetDepartmentDto | GetYearDto;
  @Input() Link!: string;
  name!: string;
  url!: string;
  constructor() {
    effect(() => {
      this.name = this.data.name ?? this.data.subjectName ?? '';
      this.url =
        this.Link !== undefined || ''
          ? `${this.data.id}/${this.Link}`
          : (this.data.id?.toString() ?? '');
    });
  }
}
