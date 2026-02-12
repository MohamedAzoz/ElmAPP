import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import {
  QuestionLeaderClient,
  QuestionPublicClient,
  OptionClient,
  QuestionsDto2,
  AddQuestionCommand,
  UpdateQuestionCommand,
  AddOptionCommand,
  UpdateOptionCommand,
  AddQuestionsDto,
} from '../../../../core/api/clients';
import { environment } from '../../../../../environments/environment.development';
import { FileParameter } from '../../../../core/api/file-parameter';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuestionFacade {
  private leaderClient = inject(QuestionLeaderClient);
  private publicClient = inject(QuestionPublicClient);
  private optionClient = inject(OptionClient);
  private http = inject(HttpClient);

  questions = signal<QuestionsDto2[]>([]);
  isLoading = signal<boolean>(false);

  getQuestionsByBankId(bankId: number) {
    this.isLoading.set(true);
    this.publicClient.byBank(bankId).subscribe({
      next: (res) => this.questions.set(res.data || []),
      complete: () => this.isLoading.set(false),
    });
  }

  // إضافة سؤال (يتطلب AddQuestionCommand)
  addQuestion(command: AddQuestionCommand) {
    return this.leaderClient.addQuestion(command);
  }
  addRingToQuestion(questionBankId: number,command: AddQuestionsDto[]) {
    return this.leaderClient.addRingQuestions(questionBankId,command);
  }

  updateQuestion(command: UpdateQuestionCommand) {
    return this.leaderClient.updateQuestion(command);
  }

  deleteQuestion(id: number) {
    return this.http.delete(`${environment.apiUrl}api/leader/QuestionLeader/${id}`);
  }

  // تحميل تمبلت الإكسيل (تعامل مع Blob)
  exportTemplate(bankId: number) : Observable<HttpResponse<Blob>> {
    const url = `${environment.apiUrl}api/leader/QuestionLeader/ExportTemplateForQuestions/${bankId}`;
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }

  uploadExcel(bankId: number, file: File) {
    // const formData = new FormData();
    // formData.append('file', file);
    const fileParameter: FileParameter = {
      data: file,
      fileName: file.name,
    };
    return  this.leaderClient.addByExcelQuestions(fileParameter,bankId );
    // return this.http.post(
    //   `${environment.apiUrl}api/leader/QuestionLeader/AddByExcelQuestions`,
    //   {
    //     headers: {
    //       'Content-Type': 'multipart/form-data',
    //     },
    //     body: {
    //       file: formData,
    //       bankId: bankId,
    //     },
    //   },
    // );
  }

  // الخيارات
  addOption(command: AddOptionCommand) {
    return this.optionClient.addOption(command);
  }
  updateOption(command: UpdateOptionCommand) {
    return this.optionClient.updateOption(command);
  }
  deleteOption(id: number) {
    return this.optionClient.deleteOption(id);
  }
}
