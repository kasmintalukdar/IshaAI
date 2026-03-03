// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class IshaaV2Service {

//   constructor() { }
// }



import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IshaaV2Service {
  // This points to the new Node.js backend route you created
  private baseUrl = `${environment.apiUrl}/ai/v2/ishaa`; 

  constructor(private http: HttpClient) { }

  // Check if the AI is awake
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // Example: Asking the AI for help (assuming your python route is /ai_help/ask)
  askQuestion(question: string, context?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/ai_help/ask`, {
      question: question,
      context: context || "General Science"
    });
  }
}