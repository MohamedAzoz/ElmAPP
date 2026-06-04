import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SectionFacade } from '../section-facade';

@Component({
  selector: 'app-code-playground',
  imports: [ RouterLink],
  templateUrl: './code-playground.html',
  styleUrl: './code-playground.css',
})
export class CodePlayground {
  sectionFacade = inject(SectionFacade);
  private active = inject(ActivatedRoute);
  private router = inject(Router);

  private params = toSignal(this.active.paramMap, {
    initialValue: this.active.snapshot.paramMap,
  });
  private queryParams = toSignal(this.active.queryParamMap, {
    initialValue: this.active.snapshot.queryParamMap,
  });

  private lastLoadedId = signal<number | null>(null);
  sectionId = computed(() => Number(this.params().get('sectionId')));
  curriculumId = computed(() => Number(this.params().get('curriculumId')));

  // Get active section info from the facade sections list
  activeSection = computed(() => 
    this.sectionFacade.sections().find(s => s.id === this.sectionId())
  );

  // Get code snippet from details
  codeSnippet = computed(() => {
    const details = this.sectionFacade.sectionDetails();
    if (details.length > 0) {
      return details[0].codeSnippet || '// لا يوجد كود متاح لهذه التجربة حاليًا';
    }
    return '';
  });

  // Split code snippet into lines for numbering
  codeLines = computed(() => {
    const code = this.codeSnippet();
    return code ? code.split('\n') : [];
  });

  // Filter other sections for the bottom tabs
  otherSections = computed(() => 
    this.sectionFacade.sections()
  );

  constructor() {
    effect(() => {
      const id = this.sectionId();
      if (id > 0) {
        if (this.lastLoadedId() === id) return;
        this.lastLoadedId.set(id);
        this.sectionFacade.getSectionsDetails(id);
      }
    });
  }

  // Navigate to Compiler workspace
  openInCompiler() {
    // Build absolute path using route params
    const collegeId = this.active.snapshot.paramMap.get('collegeId');
    const yearId = this.active.snapshot.paramMap.get('yearId');
    const departmentId = this.active.snapshot.paramMap.get('departmentId');
    
    // We navigate to the compiler route defined in public.routes.ts
    // Since we are coming from the sections page we don't have a specific curriculumId,
    // so we use '0' as a placeholder to satisfy the route pattern.
    this.router.navigate(
      ['/main/colleges', collegeId, 'years', yearId, 'departments', departmentId, 'curriulums', 0, 'C'],
      { state: { code: this.codeSnippet() } }
    );
  }
}

