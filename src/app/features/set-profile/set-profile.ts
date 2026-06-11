import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SetProfileFacade } from './service/set-profile-facade';
import { StudentAuthService } from '../../core/Services/student-auth.service';

@Component({
  selector: 'app-set-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './set-profile.html',
  styleUrl: './set-profile.css',
})
export class SetProfile implements OnInit {
  facade = inject(SetProfileFacade);
  authService = inject(StudentAuthService);

  ngOnInit() {
    this.facade.loadInitialData();
  }

  onCollegeChange(event: any) {
    const value = event.target.value;
    if (value) this.facade.onCollegeChange(Number(value));
  }

  onYearChange(event: any) {
    const value = event.target.value;
    if (value) this.facade.onYearChange(Number(value));
  }

  onDepartmentChange(event: any) {
    const value = event.target.value;
    if (value) this.facade.onDepartmentChange(Number(value));
  }

  onSubmit() {
    const colId = this.facade.selectedCollegeId();
    const yrId = this.facade.selectedYearId();
    const depId = this.facade.selectedDepartmentId();

    if (colId && yrId && depId) {
      this.authService.completeOnboarding({
        college: colId,
        academicYear: yrId,
        department: depId,
      });
    }
  }
}
