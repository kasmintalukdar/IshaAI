import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

// --- Interfaces ---
export interface BoardTrend {
  weekLabel: string;
  date: string;
  probability: number;
}

export interface TopicStat {
  name: string;
  accuracy: number;
  count: number;
}

export interface RootCauseItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopicDiagnostic {
  topic: string;
  accuracy: number;
  timeTaken: number;
  status: 'Mastered' | 'Improving' | 'Weak';
}

export interface CognitiveSkill {
  skill: string;
  percentage: number;
}

export interface RootCause {
  weakestTopic: string;
  accuracy: number;
  dependencies: { name: string; impact: number }[];
  totalErrors: number;
  items: RootCauseItem[];
}

export interface RetentionHealth {
  overallRetention: number;
  hasData: boolean;
  healthStatus: string;
  insight: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface ChapterRootCause {
  Conceptual: number;
  Silly: number;
  Time: number;
  Guessing: number;
}

export interface ChapterAnalysis {
  _id: string;
  subjectName: string;
  topics: TopicStat[];
  rootCauses: ChapterRootCause;
  timePressureStatus: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = `${environment.apiUrl || '/api/v1'}/reports`;

  constructor(private http: HttpClient) {}

  getBoardTrend(): Observable<BoardTrend[]> {
    return this.fetchData<BoardTrend[]>('board-trend', []);
  }

  getTopicDiagnostics(): Observable<TopicDiagnostic[]> {
    return this.fetchData<TopicDiagnostic[]>('topic-diagnostics', []);
  }

  getRootCause(): Observable<RootCause | null> {
    return this.fetchData<RootCause | null>('root-cause', null);
  }

  getCognitiveSkills(): Observable<CognitiveSkill[]> {
    return this.fetchData<CognitiveSkill[]>('cognitive-skills', []);
  }

  getChapterAnalysis(): Observable<ChapterAnalysis[]> {
    return this.fetchData<ChapterAnalysis[]>('chapter-analysis', []);
  }

  getRetentionHealth(): Observable<RetentionHealth | null> {
    return this.fetchData<RetentionHealth | null>('retention-health', null);
  }

  private fetchData<T>(endpoint: string, fallback: T): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, { withCredentials: true }).pipe(
      map((response) => response.data),
      shareReplay(1),
      catchError((err) => {
        console.error(`Error fetching ${endpoint}:`, err);
        return of(fallback);
      })
    );
  }
}
