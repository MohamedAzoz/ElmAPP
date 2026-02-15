import { Injectable, signal } from '@angular/core';
import {
  QuestionWithOptions,
  StartTestCommand,
  TestClient,
  } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class TestFacade {
  // المصفوفة مباشرة لأن الباك إند يرجع قائمة أسئلة
  currentTestData = signal<QuestionWithOptions[]>([]);
  isStarting = signal<boolean>(false);

  constructor(private testClient: TestClient) {}

  startTest(body: StartTestCommand) {
    this.isStarting.set(true);
    return this.testClient.start(body);
  }
}
