import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentAuthService } from '../../../core/Services/student-auth.service';

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink],
  templateUrl: './student-dashboard.html',
})
export class StudentDashboard {
  studentAuth = inject(StudentAuthService);
}
