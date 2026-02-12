import { Component, OnInit, inject, effect } from '@angular/core';
import { UniversityFacade } from '../uniersty-facade';
import { CollegeFacade } from '../../Colleges/college-facade';
import { CollegeCarde } from '../../../../shared/Components/college-carde/college-carde';
import { Skeleton } from 'primeng/skeleton';
import { GlobalService } from '../../../../core/Services/global-service';

@Component({
  selector: 'app-home',
  imports: [CollegeCarde, Skeleton], // لم نعد بحاجة لـ AsyncPipe
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  // استخدام inject كبديل للـ constructor (الأسلوب الحديث)
  universityFacade = inject(UniversityFacade);
  collegeFacade = inject(CollegeFacade);
  title = inject(GlobalService);

  // اختصارات للوصول للـ Signals بسهولة في الـ HTML
  university = this.universityFacade.university;
  colleges = this.collegeFacade.colleges;
  isLoadingColleges = this.collegeFacade.isLoading;

  constructor() {
    // الـ effect يعمل تلقائياً
    effect(() => {
      const uni = this.university()?.id;
      if (uni != null) {
        this.collegeFacade.getAllColleges(uni);
      }
    });
  }

  ngOnInit(): void {
    this.title.setTitle('جامعة سوهاج');
    // نكتفي بتشغيل الطلب الأول فقط
    this.universityFacade.getUniversityByName();
  }
}
