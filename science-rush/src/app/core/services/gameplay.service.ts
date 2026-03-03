// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';
// import { map, tap } from 'rxjs/operators';
// import { environment } from '../../../environments/environment';
// import { Subject } from '../models/game-data.model';

// @Injectable({ providedIn: 'root' })
// export class GameplayService {
//   private apiUrl = `${environment.apiUrl}/gameplay`;

//   // --- 1. LIVE CACHE STORES ---
//   private topicProgress$ = new BehaviorSubject<Record<string, number>>({});
//   private chapterProgress$ = new BehaviorSubject<Record<string, number>>({});
//   private subjectProgress$ = new BehaviorSubject<Record<string, number>>({});

//   constructor(private http: HttpClient) {
//     // 🚨 DEBUG LOG: This proves the new file is loaded
//     console.warn('🔥 GameplayService V2 Loaded - Real-Time Cache Active');
//   }

//   // --- 2. SUBMIT ANSWER (Updates the Cache) ---
//  // --- 2. SUBMIT ANSWER (Fixed Response Handling) ---
//   submitProgress(questionId: string, isCorrect: boolean, timeTaken: number) {
//     console.log('📤 Sending Answer to Backend...');

//     return this.http.post<any>(`${this.apiUrl}/submit`, {
//       questionId, isCorrect, timeTaken
//     }, { withCredentials: true }).pipe(
//       tap(response => {
//         console.log('📥 Backend Replied:', response);

//         // 🚨 CRITICAL FIX: Extract 'data' first!
//         // The backend sends: { status: 'success', data: { updatedProgress: ... } }
//         const result = response.data;

//         if (result && result.updatedProgress) {
//           console.log('✅ UI Cache Updating with:', result.updatedProgress);
//           this.updateLocalCache(result.updatedProgress);
//         } else {
//           console.warn('⚠️ No progress updates found inside response.data');
//         }
//       })
//     );
//   }

//   private updateLocalCache(updates: any) {
//     if (updates.topic) {
//       const current = this.topicProgress$.value;
//       this.topicProgress$.next({ ...current, [updates.topic.id]: updates.topic.percent });
//     }
//     if (updates.chapter) {
//       const current = this.chapterProgress$.value;
//       this.chapterProgress$.next({ ...current, [updates.chapter.id]: updates.chapter.percent });
//     }
//     if (updates.subject) {
//       const current = this.subjectProgress$.value;
//       this.subjectProgress$.next({ ...current, [updates.subject.name]: updates.subject.percent });
//     }
//   }

//   // --- 3. GETTERS (Prioritize Cache) ---

//   getSubjects(): Observable<Subject[]> {
//     return this.http.get<{ data: any[] }>(`${this.apiUrl}/subjects`, { withCredentials: true }).pipe(
//       map(response => response.data.map(s => {
//         // 1. Check Live Cache (e.g. just played a game)
//         const livePercent = this.subjectProgress$.value[s.name];

//         // 2. Check DB Value (e.g. just refreshed page)
//         const dbPercent = s.progress || 0;
//         return {
//           id: s.name,
//           name: s.name,
//           icon: s.icon_url || `assets/images/subjects/${s.name.toLowerCase()}.svg`,
//           color: s.theme_color || this.getColor(s.name),
//           totalChapters: s.total_chapters || 0,
//           completedChapters: 0,
//           // FIX: Use Live Cache if exists, otherwise DB value
//           progress: livePercent !== undefined ? livePercent : dbPercent
//         };
//       }))
//     );
//   }

//   getInsights(): Observable<any> {
//     return this.http.get<{ data: any }>(`${this.apiUrl}/insights`, { withCredentials: true }).pipe(
//       map(response => response.data)
//     );
//   }

//   getChapters(subjectName: string): Observable<any[]> {
//     return this.http.get<{ data: any[] }>(`${this.apiUrl}/chapters`, { params: { subject: subjectName } }).pipe(
//       map(res => res.data.map(c => {
//         const livePercent = this.chapterProgress$.value[c._id];
//         return {
//           id: c._id,
//           title: c.name,
//           orderIndex: c.order_index,
//           status: c.is_active ? 'ACTIVE' : 'LOCKED',
//           progress: livePercent !== undefined ? livePercent : (c.progress || 0),
//           position: this.calculatePosition(c.order_index)
//         };
//       }))
//     );
//   }

//   getTopics(chapterId: string): Observable<any[]> {
//     return this.http.get<{ data: any[] }>(`${this.apiUrl}/topics`, { params: { chapterId }, withCredentials: true }).pipe(
//       map(res => res.data.map(t => {
//         const livePercent = this.topicProgress$.value[t._id];
//         return {
//           id: t._id,
//           title: t.name,
//           orderIndex: t.order_index,
//           status: 'ACTIVE',
//           progress: livePercent !== undefined ? livePercent : (t.progress || 0),
//           position: this.calculatePosition(t.order_index)
//         };
//       }))
//     );
//   }

//   // ... (Keep existing getQuestions/Helpers) ...
//   // getQuestions(topicId: string): Observable<any[]> {
//   //   return this.http.get<{ status: string, data: any[] }>(`${this.apiUrl}/questions`, {
//   //     params: { topicId },
//   //     withCredentials: true
//   //   }).pipe(map(response => response.data || []));
//   // }

//  getQuestions(topicId: string): Observable<any[]> {
//     return this.http.get<{ status: string, data: any[] }>(`${this.apiUrl}/questions`, {
//       params: { topicId },
//       withCredentials: true
//     }).pipe(
//       map(response => {
//         // ✅ No mapping needed! The DB sends exactly what UI needs.
//         return response.data || [];
//       })
//     );
//   }

//   private calculatePosition(index: number): 'left' | 'center' | 'right' {
//     const mod = index % 4;
//     return mod === 1 ? 'center' : mod === 2 ? 'left' : mod === 3 ? 'center' : 'right';
//   }

//   private getColor(subject: string): string {
//     const colors: any = { 'Physics': '#ffc800', 'Chemistry': '#ff4b4b', 'Maths': '#1cb0f6', 'Biology': '#58cc02' };
//     return colors[subject] || '#ccc';
//   }
// }










// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';
// import { map, tap } from 'rxjs/operators';
// import { environment } from '../../../environments/environment';
// import { Subject } from '../models/game-data.model';
// import { AuthService } from './auth.service';
// import type { UserIdentity } from './auth.service';

// @Injectable({ providedIn: 'root' })
// export class GameplayService {
//   private apiUrl = `${environment.apiUrl}/gameplay`;

//   // Live Cache Stores
//   private topicProgress$ = new BehaviorSubject<Record<string, number>>({});
//   private chapterProgress$ = new BehaviorSubject<Record<string, number>>({});
//   private subjectProgress$ = new BehaviorSubject<Record<string, number>>({});

//   constructor(private http: HttpClient, private auth: AuthService) {}

//   // --- 1. GET QUESTIONS (THE FIX) ---
//   getQuestions(topicId: string): Observable<any[]> {
//     return this.http
//       .get<{ status: string; data: any[] }>(`${this.apiUrl}/questions`, {
//         params: { topicId },
//         withCredentials: true,
//       })
//       .pipe(
//         map((response) => {
//           // ✅ No mapping needed! The DB sends exactly what UI needs.
//           return response.data || [];
//         })
//       );
//   }
//   // --- 2. GET SUBJECTS ---
//   getSubjects(): Observable<Subject[]> {
//     return this.http
//       .get<{ data: any[] }>(`${this.apiUrl}/subjects`, {
//         withCredentials: true,
//       })
//       .pipe(
//         map((response) =>
//           response.data.map((s) => {
//             const livePercent = this.subjectProgress$.value[s.name];
//             return {
//               id: s.name,
//               name: s.name,
//               icon:
//                 s.icon_url ||
//                 `assets/images/subjects/${s.name.toLowerCase()}.svg`,
//               color: s.theme_color || '#ccc',
//               totalChapters: s.total_chapters || 0,
//               completedChapters: 0,
//               progress:
//                 livePercent !== undefined ? livePercent : s.progress || 0,
//             };
//           })
//         )
//       );
//   }

//   // --- 3. GET CHAPTERS ---
//   getChapters(subjectName: string): Observable<any[]> {
//     return this.http
//       .get<{ data: any[] }>(`${this.apiUrl}/chapters`, {
//         params: { subject: subjectName },
//       })
//       .pipe(
//         map((res) =>
//           res.data.map((c) => {
//             const livePercent = this.chapterProgress$.value[c._id];
//             return {
//               id: c._id,
//               title: c.name,
//               orderIndex: c.order_index,
//               status: c.is_active ? 'ACTIVE' : 'LOCKED',
//               progress:
//                 livePercent !== undefined ? livePercent : c.progress || 0,
//               position: this.calculatePosition(c.order_index),
//               banner: c.banner,
//             };
//           })
//         )
//       );
//   }

//   // --- 4. GET TOPICS ---
//   getTopics(chapterId: string): Observable<any[]> {
//     return this.http
//       .get<{ data: any[] }>(`${this.apiUrl}/topics`, {
//         params: { chapterId },
//         withCredentials: true,
//       })
//       .pipe(
//         map((res) =>
//           res.data.map((t) => {
//             console.log(t);
//             const livePercent = this.topicProgress$.value[t._id];
//             return {
//               id: t._id,
//               title: t.name,
//               orderIndex: t.order_index,
//               status: 'ACTIVE',
//               progress:
//                 livePercent !== undefined ? livePercent : t.progress || 0,
//               position: this.calculatePosition(t.order_index),
//               image: t.image,
//             };
//           })
//         )
//       );
//   }

//   // --- 5. SUBMIT ANSWER ---
//   submitProgress(questionId: string, isCorrect: boolean, timeTaken: number) {
//     return this.http
//       .post<any>(
//         `${this.apiUrl}/submit`,
//         {
//           questionId,
//           isCorrect,
//           timeTaken,
//         },
//         { withCredentials: true }
//       )
//       .pipe(
//         tap((response) => {
//           const result = response.data;
//           if (result && result.updatedProgress) {
//             this.updateLocalCache(result.updatedProgress);
//           }
//         })
//       );
//   }

//   // --- 6. STUDENT INSIGHTS (Dashboard) ---
//   getInsights(): Observable<any> {
//     return this.http
//       .get<{ data: any }>(`${this.apiUrl}/insights`, { withCredentials: true })
//       .pipe(map((response) => response.data));
//   }

//   // Helpers
//   private updateLocalCache(updates: any) {
//     if (updates.topic)
//       this.topicProgress$.next({
//         ...this.topicProgress$.value,
//         [updates.topic.id]: updates.topic.percent,
//       });
//     if (updates.chapter)
//       this.chapterProgress$.next({
//         ...this.chapterProgress$.value,
//         [updates.chapter.id]: updates.chapter.percent,
//       });
//     if (updates.subject)
//       this.subjectProgress$.next({
//         ...this.subjectProgress$.value,
//         [updates.subject.name]: updates.subject.percent,
//       });
//   }

//   private calculatePosition(index: number): 'left' | 'center' | 'right' {
//     const mod = index % 4;
//     return mod === 1
//       ? 'center'
//       : mod === 2
//       ? 'left'
//       : mod === 3
//       ? 'center'
//       : 'right';
//   }

//   updateStreak() {
//     console.log('updatinggg');

//     return this.http
//       .post<{ status: string; data: { streak: number } }>(
//         `${this.apiUrl}/update-streak`,
//         {},
//         { withCredentials: true }
//       )
//       .pipe(
//         tap((response) => {
//           const newStreak = response.data.streak;
//           const currentUser = this.auth.getUser();

//           if (currentUser) {
//             const currentGami = currentUser.gamification || {
//               total_xp: 0,
//               streak: 0,
//             };

//             const updatedUser: UserIdentity = {
//               ...currentUser,
//               gamification: {
//                 ...currentGami,
//                 streak: newStreak,
//                 total_xp: currentGami.total_xp ?? 0,
//               },
//             };
//             this.auth.updateUserState(updatedUser);
//           }
//         })
//       );

      
//   }

//   getDailyPlans(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/daily-plans`);
//   }
// }










import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Subject } from '../models/game-data.model';
import { AuthService } from './auth.service';
import type { UserIdentity } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GameplayService {
  private apiUrl = `${environment.apiUrl}/gameplay`;
  private analyticsUrl = `${environment.apiUrl}/analytics`;

  // Live Cache Stores
  private topicProgress$ = new BehaviorSubject<Record<string, number>>({});
  private chapterProgress$ = new BehaviorSubject<Record<string, number>>({});
  private subjectProgress$ = new BehaviorSubject<Record<string, number>>({});

  constructor(private http: HttpClient, private auth: AuthService) {}

  // --- 1. GET QUESTIONS ---
  getQuestions(topicId: string): Observable<any[]> {
    return this.http
      .get<{ status: string; data: any[] }>(`${this.apiUrl}/questions`, {
        params: { topicId },
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          return response.data || [];
        })
      );
  }

  getQuestionsByIds(ids: string[]): Observable<any> {
    // Passing IDs as a comma-separated string
    return this.http.get(`${this.apiUrl}/questions`, { 
      params: { ids: ids.join(',') } 
    });
  }

  // --- 2. GET SUBJECTS ---
  getSubjects(): Observable<Subject[]> {
    return this.http
      .get<{ data: any[] }>(`${this.apiUrl}/subjects`, {
        withCredentials: true,
      })
      .pipe(
        map((response) =>
          response.data.map((s) => {
            const livePercent = this.subjectProgress$.value[s.name];
            return {
              id: s.name,
              name: s.name,
              icon: s.icon_url || `assets/images/subjects/${s.name.toLowerCase()}.svg`,
              color: s.theme_color || '#ccc',
              totalChapters: s.total_chapters || 0,
              completedChapters: 0,
              progress: livePercent !== undefined ? livePercent : s.progress || 0,
            };
          })
        )
      );
  }

  // --- 3. GET CHAPTERS ---
  getChapters(subjectName: string): Observable<any[]> {
    return this.http
      .get<{ data: any[] }>(`${this.apiUrl}/chapters`, {
        params: { subject: subjectName },
      })
      .pipe(
        map((res) =>
          res.data.map((c) => {
            const livePercent = this.chapterProgress$.value[c._id];
            return {
              id: c._id,
              title: c.name,
              orderIndex: c.order_index,
              status: c.is_active ? 'ACTIVE' : 'LOCKED',
              progress: livePercent !== undefined ? livePercent : c.progress || 0,
              position: this.calculatePosition(c.order_index),
              banner: c.banner,
            };
          })
        )
      );
  }

  // --- 4. GET TOPICS ---
  getTopics(chapterId: string): Observable<any[]> {
    return this.http
      .get<{ data: any[] }>(`${this.apiUrl}/topics`, {
        params: { chapterId },
        withCredentials: true,
      })
      .pipe(
        map((res) =>
          res.data.map((t) => {
            const livePercent = this.topicProgress$.value[t._id];
            return {
              id: t._id,
              title: t.name,
              orderIndex: t.order_index,
              status: 'ACTIVE',
              progress: livePercent !== undefined ? livePercent : t.progress || 0,
              position: this.calculatePosition(t.order_index),
              image: t.image,
            };
          })
        )
      );
  }

  // --- 5. SUBMIT ANSWER (Legacy & New Support) ---
  
  // New method name matching controller logic
  submitAnswer(questionId: string, isCorrect: boolean, timeTaken: number) {
    return this.submitProgress(questionId, isCorrect, timeTaken);
  }

  // Legacy method name (kept for compatibility)
  submitProgress(questionId: string, isCorrect: boolean, timeTaken: number) {
    return this.http
      .post<any>(
        `${this.apiUrl}/submit`,
        {
          questionId,
          isCorrect,
          timeTaken,
        },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          const result = response.data;
          if (result && result.updatedProgress) {
            this.updateLocalCache(result.updatedProgress);
          }
        })
      );
  }

  // --- 6. STUDENT INSIGHTS (Dashboard) ---
  getInsights(): Observable<any> {
    return this.http
      .get<{ data: any }>(`${this.apiUrl}/insights`, { withCredentials: true })
      .pipe(map((response) => response.data));
  }

  // --- 7. DAILY PLANS (AI Tutor) ---
  getDailyPlans(): Observable<any> {
    return this.http
      .get<{ status: string; data: any }>(`${this.apiUrl}/daily-plans`, { withCredentials: true })
      .pipe(map(response => response.data));
  }

  // --- 8. STREAK MANAGEMENT ---
  updateStreak() {
    return this.http
      .post<{ status: string; data: { streak: number } }>(
        `${this.apiUrl}/update-streak`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          const newStreak = response.data.streak;
          const currentUser = this.auth.getUser();

          if (currentUser) {
            const currentGami = currentUser.gamification || {
              total_xp: 0,
              streak: 0,
            };

            const updatedUser: UserIdentity = {
              ...currentUser,
              gamification: {
                ...currentGami,
                streak: newStreak,
                total_xp: currentGami.total_xp ?? 0,
              },
            };
            this.auth.updateUserState(updatedUser);
          }
        })
      );
  }


  getDashboardPulse(): Observable<{ status: string; data: any }> {
    return this.http.get<{ status: string; data: any }>(
      `${this.analyticsUrl}/dashboard-pulse`, 
      { withCredentials: true }
    );
  }

  getFormulas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/formulas`);
  }

  

  // Helpers
  private updateLocalCache(updates: any) {
    if (updates.topic)
      this.topicProgress$.next({
        ...this.topicProgress$.value,
        [updates.topic.id]: updates.topic.percent,
      });
    if (updates.chapter)
      this.chapterProgress$.next({
        ...this.chapterProgress$.value,
        [updates.chapter.id]: updates.chapter.percent,
      });
    if (updates.subject)
      this.subjectProgress$.next({
        ...this.subjectProgress$.value,
        [updates.subject.name]: updates.subject.percent,
      });
  }

  private calculatePosition(index: number): 'left' | 'center' | 'right' {
    const mod = index % 4;
    return mod === 1
      ? 'center'
      : mod === 2
      ? 'left'
      : mod === 3
      ? 'center'
      : 'right';
  }
}