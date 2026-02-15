import { Component, inject, OnInit } from '@angular/core';
import { CurriulumFacade } from '../curriulum-facade';
import { IdentitySignals } from '../../../../core/Auth/services/identity-signals';
import { DirectionService } from '../../../../core/Services/direction';
import { Carde } from '../../../../shared/Components/carde/carde';

@Component({
  selector: 'app-my-subjects',
  imports: [Carde],
  templateUrl: './my-subjects.html',
  styleUrl: './my-subjects.scss',
})
export class MySubjects implements OnInit {
  private curriulumFacade = inject(CurriulumFacade);
  private identity = inject(IdentitySignals);
  public dir = inject(DirectionService);
  curriulums = this.curriulumFacade.curriulums;
  
  ngOnInit() {
    this.curriulumFacade.getCurriulumsByStudentId(
      this.identity.userId || '1600fc10-9900-4785-82d5-bf67a9642b80',
    );
  }
}
