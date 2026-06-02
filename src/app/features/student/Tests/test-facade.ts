import { inject, Injectable, signal } from '@angular/core';
import { QuestionWithOptions, StartTestCommand, TestClient } from '../../../core/api/clients';
import { LocalStorage } from '../../../core/Services/local-storage';

@Injectable({
  providedIn: 'root',
})
export class TestFacade {
  private localStorage = inject(LocalStorage);
  private testClient = inject(TestClient);

  currentTestData = signal<QuestionWithOptions[]>([]);
  isStarting = signal<boolean>(false);
  private startTime = signal<number>(0);
  private totalTestDurationSeconds = signal<number>(0);
  private endTime = signal<number>(0);

  startTest(body: StartTestCommand) {
    this.isStarting.set(true);
    const time = Date.now();
    this.startDuration(time);
    return this.testClient.start(body);
  }

  //#region Getter & Setter

  private startDuration(time: number) {
    this.localStorage.set('startTime', time);
    this.startTime.set(time);
  }

  public get startTimeValue(): number {
    return this.startTime() || Number(this.localStorage.get('startTime')) || 0;
  }

  public endDuration(time: number) {
    // تصحيح: الحفظ في مفتاح endTime والـ signal الخاص به
    this.localStorage.set('endTime', time);
    this.endTime.set(time);
  }

  public get endTimeValue(): number {
    return this.endTime() || Number(this.localStorage.get('endTime')) || 0;
  }

  public setTotalTestDurationSeconds(time: number) {
    this.localStorage.set('totalTestDurationSeconds', time);
    this.totalTestDurationSeconds.set(time);
  }

  public get getTotalTestDurationSeconds(): number {
    return (
      this.totalTestDurationSeconds() ||
      Number(this.localStorage.get('totalTestDurationSeconds')) ||
      0
    );
  }
  //#endregion
}