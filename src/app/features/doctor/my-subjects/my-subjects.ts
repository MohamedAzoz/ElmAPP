import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // الكومبوننت الخاص بالكارد
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CurriulumFacade } from '../Services/curriulum-facade';
import { GlobalService } from '../../../core/Services/global-service';
import { IdentitySignals } from '../../../core/Auth/services/identity-signals';
import { Carde } from '../../../shared/Components/carde/carde';

@Component({
  selector: 'app-my-subjects',
  standalone: true,
  imports: [CommonModule, Carde, ProgressSpinnerModule],
  templateUrl: './my-subjects.html',
  styleUrl: './my-subjects.scss',
})
export class MySubjects implements OnInit {
  private curriulumFacade = inject(CurriulumFacade);
  private title = inject(GlobalService);
  private indentity = inject(IdentitySignals);
  curriculums = this.curriulumFacade.curriulums;
  isLoading = this.curriulumFacade.isLoading;

  ngOnInit() {
    this.title.setTitle('المواد');
    const doctorId = this.indentity.userId || '09bf356d-5114-4df6-905a-2a15a265e6c9';

    if (doctorId) {
      this.curriulumFacade.getCurriulumByUserId(doctorId);
    }
  }
}
