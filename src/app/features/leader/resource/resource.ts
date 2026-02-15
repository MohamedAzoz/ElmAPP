import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from '../../../core/Services/global-service';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CurriulumFacade } from '../../student/Curriulums/curriulum-facade';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-resource',
  imports: [RouterLink, CardModule, ButtonModule],
  templateUrl: './resource.html',
  styleUrl: './resource.scss',
})
export class Resource implements OnInit {
  private active = inject(ActivatedRoute);
  private title = inject(GlobalService);
  private curriulumFacade = inject(CurriulumFacade);

  private lastLoadedId = signal<number | null>(null);
  private params = toSignal(this.active.paramMap);

  curriulum = computed(() => this.curriulumFacade.curriulum());
  private curriculumId = computed(() => Number(this.params()?.get('curriculumId')));

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (!id || this.lastLoadedId() === id) return;
      this.curriulumFacade.getCurriulum(id);
      this.lastLoadedId.set(id);
    });
  }

  ngOnInit(): void {
    this.title.setTitle('المصادر');
  }
}
