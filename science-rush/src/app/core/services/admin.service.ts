import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  publishChapter(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ingest/chapter`, payload, {
      withCredentials: true,
    });
  }

  createSubject(
    name: string,
    streamId: string,
    description: string,
    image: File | null
  ) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('stream_id', streamId);
    formData.append('description', description || '');

    if (image) {
      formData.append('image', image);
    }

    return this.http.post(`${this.apiUrl}/subjects`, formData);
  }

  // 🟢 2. Update Subject Image Only (for the PATCH route we created)
  updateSubjectImage(subjectId: string, image: File) {
    const formData = new FormData();
    formData.append('image', image);

    return this.http.patch(
      `${this.apiUrl}/subjects/${subjectId}/image`,
      formData
    );
  }
}
