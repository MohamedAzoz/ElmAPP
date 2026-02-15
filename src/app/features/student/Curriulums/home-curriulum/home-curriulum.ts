import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurriulumFacade } from '../curriulum-facade';
import { CardModule } from 'primeng/card';
import { GlobalService } from '../../../../core/Services/global-service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home-curriulum',
  imports: [CardModule, RouterLink],
  templateUrl: './home-curriulum.html',
  styleUrl: './home-curriulum.scss',
})
export class HomeCurriulum implements OnInit {
  private active = inject(ActivatedRoute);
  private title = inject(GlobalService);
 curriulumFacade = inject(CurriulumFacade);

  private lastLoadedId = signal<number | null>(null);
  private params = toSignal(this.active.paramMap);

  curriulum = computed(() => this.curriulumFacade.curriulum());
  private curriculumId = computed(() => Number(this.params()?.get('curriculumId')));

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (!id || this.lastLoadedId() === id) return;
      this.lastLoadedId.set(id);
      this.curriulumFacade.getCurriulum(id);
    });
  }

  ngOnInit(): void {
    this.title.setTitle('المصادر');
    // مراقبة التغير في الـ URL وجلب البيانات مرة واحدة فقط
    // this.active.paramMap.subscribe((params) => {
    //   const id = Number(params.get('curriculumId'));
    //   if (!isNaN(id) && id > 0) {
    //     this.curriulumFacade.getCurriulum(id);
    //   }
    // });
  }
}
