import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // الكومبوننت الخاص بالكارد
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CurriulumFacade } from '../Services/curriulum-facade';
import { IdentitySignals } from '../../../core/Auth/services/identity-signals';
import { Carde } from '../../../shared/Components/carde/carde';

@Component({
  selector: 'app-my-subjects',
  standalone: true,
  imports: [CommonModule, Carde, ProgressSpinnerModule],
  templateUrl: './my-subjects.html',
  styleUrl: './my-subjects.css',
})
export class MySubjects implements OnInit {
  private curriulumFacade = inject(CurriulumFacade);
  private indentity = inject(IdentitySignals);
  curriculums = this.curriulumFacade.curriulums;
  isLoading = this.curriulumFacade.isLoading;

  ngOnInit() {
    this.curriulumFacade.getCurriulumByUserId();
  }
}
