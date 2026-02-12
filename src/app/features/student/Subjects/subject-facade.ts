import { Injectable } from '@angular/core';
import { SubjectPublicClient } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class SubjectFacade {
  constructor(private subjectPublicClient: SubjectPublicClient) {}

  getAllSubjects(departmentId: number) {
    return this.subjectPublicClient.getAllSubjects(departmentId);
  }

  getSubjectById(subjectId: number) {
    return this.subjectPublicClient.getSubjectById(subjectId);
  }
}
