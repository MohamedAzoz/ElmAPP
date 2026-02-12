import { Injectable, signal } from '@angular/core';
import {
  StartTestCommand,
  SubmitTestCommand,
  TestClient,
  TestDataDto,
} from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class TestFacade {
  currentTestData = signal<TestDataDto | null>(null);
  isStarting = signal<boolean>(false);

  constructor(private testClient: TestClient) {}

  // في الملف test-facade.ts
  startTest(body: StartTestCommand) {
    this.isStarting.set(true);
    // نرجع الـ Observable للمكون ليقرر أين يذهب بعد النجاح
    return this.testClient.start(body);
  }

  submitTest(body: SubmitTestCommand) {
    return this.testClient.submit(body);
  }
}
