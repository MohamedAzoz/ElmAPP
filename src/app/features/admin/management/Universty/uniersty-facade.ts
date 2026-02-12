import { Injectable } from '@angular/core';
import {
  AddUniversityCommand,
  UniversityAdminClient,
  UniversityPublicClient,
  UpdateUniversityCommand,
} from '../../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class UniversityFacade {
  constructor(
    private university: UniversityAdminClient,
    private universityPublic: UniversityPublicClient,
  ) {}

  getUniversitieById() {
    return this.universityPublic.getUniversit();
  }
  addUniversity(university: AddUniversityCommand) {
    return this.university.addUniversity(university);
  }
  updateUniversity(university: UpdateUniversityCommand) {
    return this.university.updateUniversity(university);
  }
  deleteUniversity(id: number) {
    return this.university.deleteUniversity(id);
  }
}
