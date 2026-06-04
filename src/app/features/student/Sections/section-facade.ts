import { Injectable, signal, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  GetSectionDto,
  GetSectionDetailsDto,
  SectionPublicClient,
  CurriulumPublicClient,
} from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class SectionFacade {
  sections = signal<GetSectionDto[]>([]);
  sectionDetails = signal<GetSectionDetailsDto[]>([]);
  isSectionLoading = signal<boolean>(false);

  private sectionPublicService = inject(SectionPublicClient);
  private curriulumPublicClient = inject(CurriulumPublicClient);

  getSections(curriculumId: number) {
    this.isSectionLoading.set(true);
    return this.sectionPublicService.getAllSections(curriculumId).subscribe({
      next: (res) => {
        this.sections.set(res.data || []);
        this.isSectionLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.sections.set([]);
        this.isSectionLoading.set(false);
      },
    });
  }

  getSectionsByDepartment(departmentId: number, yearId: number) {
    this.isSectionLoading.set(true);
    return this.curriulumPublicClient.getAllByDeptIdAndYearId(departmentId, yearId).subscribe({
      next: (res) => {
        const curriculums = res.data || [];
        if (curriculums.length === 0) {
          this.sections.set([]);
          this.isSectionLoading.set(false);
          return;
        }

        const validCurriculums = curriculums.filter(c => c.id !== undefined && c.id !== null);
        if (validCurriculums.length === 0) {
          this.sections.set([]);
          this.isSectionLoading.set(false);
          return;
        }

        const requests = validCurriculums.map(c => this.sectionPublicService.getAllSections(c.id!));

        forkJoin(requests).subscribe({
          next: (results) => {
            const allSections: GetSectionDto[] = [];
            results.forEach(r => {
              if (r.data) {
                allSections.push(...r.data);
              }
            });
            this.sections.set(allSections);
            this.isSectionLoading.set(false);
          },
          error: (err) => {
            console.error(err);
            this.sections.set([]);
            this.isSectionLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.sections.set([]);
        this.isSectionLoading.set(false);
      }
    });
  }

  getSectionsDetails(sectionId: number) {
    this.isSectionLoading.set(true);
    return this.sectionPublicService.getSectionDetails(sectionId).subscribe({
      next: (res) => {
        this.sectionDetails.set(res.data || []);
        this.isSectionLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.sectionDetails.set([]);
        this.isSectionLoading.set(false);
      },
    });
  }
}
