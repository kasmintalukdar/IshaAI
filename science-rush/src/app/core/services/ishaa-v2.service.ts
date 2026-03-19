// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { environment } from 'src/environments/environment';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class IshaaV2Service {
//   // This points to the new Node.js backend route you created
//   private baseUrl = `${environment.apiUrl}/ai/v2/ishaa`; 

//   constructor(private http: HttpClient) { }

//   // Check if the AI is awake
//   checkHealth(): Observable<any> {
//     return this.http.get(`${this.baseUrl}/health`);
//   }

//   // CORRECTED: Pointing to /ai-help/chat and using the 'message' payload
//   askQuestion(question: string): Observable<any> {
//     return this.http.post(`${this.baseUrl}/ai-help/hint`, {
//       message: question,
//       history: [] // You can later update this to pass actual chat history
//     });
//   }
// }




// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { environment } from 'src/environments/environment';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class IshaaV2Service {
//   private baseUrl = `${environment.apiUrl}/ai/v2/ishaa`; 

//   constructor(private http: HttpClient) { }

//   checkHealth(): Observable<any> {
//     return this.http.get(`${this.baseUrl}/health`);
//   }

//   askQuestion(question: string): Observable<any> {
//     // Paste your victorious token right here:
//     const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYmFkNjExOC00MTYiLCJleHAiOjE3NzQ0Nzc1NDAsImlhdCI6MTc3Mzg3Mjc0MH0.W3j_9GSjzTKrmtrZJw1rN7lsxTq4KfA9uz689Q7-lHc"; 
    
//     const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });

//     return this.http.post(`${this.baseUrl}/ai-help/chat`, {
//       question_id: "000000000000000000000000",
//       message: question,
//       history: [] 
//     }, { headers: headers });
//   }
// }





import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IshaaV2Service {
  private baseUrl = `${environment.apiUrl}/ai/v2/ishaa`; 

  constructor(private http: HttpClient) { }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // PRODUCTION READY: Dynamically accepts the specific question ID, the user's message, and past chat history
  askQuestion(questionId: string, message: string, history: any[] = []): Observable<any> {
    
    // 1. DYNAMIC TOKEN: Automatically grabs the token of whoever is currently logged into the app
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // 2. DYNAMIC PAYLOAD: Sends the exact question the student is struggling with
    return this.http.post(`${this.baseUrl}/ai-help/chat`, {
      question_id: questionId, 
      message: message,
      history: history 
    }, { headers: headers });
  }
}