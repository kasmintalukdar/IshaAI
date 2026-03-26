import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, timeout, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-my-report-page',
  templateUrl: './my-report-page.component.html',
  styleUrls: ['./my-report-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class MyReportPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // AI KPI data
  aiData: any = null;
  masteryData: any = null;
  examData: any = { predicted_score: 0, syllabus_completion: 0 };
  kpiLoading = true;
  kpiError: string | null = null;
  Math = Math;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadKpiData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // KPI getters
  get persona(): string { return this.aiData?.persona || 'Calculating...'; }
  get masteryScore(): number { return parseFloat(this.masteryData?.mastery_score) || 0; }
  get masteryLevel(): string { return this.masteryData?.level || 'Novice'; }
  get predictedScore(): number { return parseFloat(this.examData?.predicted_score || '0'); }
  get grade(): string {
    const s = this.predictedScore;
    if (s >= 80) return 'A';
    if (s >= 60) return 'B';
    if (s >= 40) return 'C';
    return 'D';
  }

  loadKpiData() {
    this.kpiLoading = true;
    this.kpiError = null;
    this.http.get(`${environment.apiUrl}/ai/dashboard`, { withCredentials: true }).pipe(
      timeout(15000),
      catchError(err => {
        console.error('KPI load failed:', err);
        if (err.status === 401) {
          this.kpiError = 'Please log in to view AI insights.';
        } else {
          this.kpiError = 'Failed to load AI insights.';
        }
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.aiData = res.persona;
        this.masteryData = res.mastery;
        this.examData = res.exam;
      }
      this.kpiLoading = false;
      this.cdr.markForCheck();
    });
  }
}
