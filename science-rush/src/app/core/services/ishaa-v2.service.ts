import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IshaaV2Service {
  private baseUrl = `${environment.apiUrl}/ai/v2/ishaa`;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  askQuestion(questionId: string, message: string, history: any[] = []): Observable<any> {
    return this.http.post(`${this.baseUrl}/ai-help/chat`, {
      question_id: questionId,
      message,
      history
    });
  }

  getHint(questionId: string, layer: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/ai-help/hint`, {
      question_id: questionId,
      layer
    });
  }

  analyzeHandwrittenWork(questionId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('question_id', questionId);
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/ai-help/vision`, formData);
  }
}
