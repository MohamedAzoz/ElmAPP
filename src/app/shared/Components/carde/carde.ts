import { Component, EventEmitter, Output, computed, effect, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GetCurriculumDto, GetDepartmentDto, GetYearDto } from '../../../core/api/clients';

@Component({
  selector: 'app-carde',
  imports: [RouterLink],
  templateUrl: './carde.html',
  styleUrl: './carde.css',
})
export class Carde {
  data = input.required<GetCurriculumDto | GetDepartmentDto | GetYearDto>();
  Link = input<string>('');
  cardType = input<'default' | 'department' | 'curriculum' | 'section' | 'bank'>('default');
  showSaveButton = input<boolean>(false);
  isSaved = input<boolean>(false);
  isSaving = input<boolean>(false);
  actionLabel = input<string>('احفظ');
  @Output() actionClick = new EventEmitter<void>();
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

  triggerAction(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.actionClick.emit();
  }
}
