


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { GameplayService } from '@core/services/gameplay.service';
import { AuthService } from '@core/services/auth.service';
import { Subject } from '@core/models/game-data.model';
import { SubjectCardComponent } from '../../components/subject-card/subject-card.component';

/* -----------------------------
   UI-SAFE INTERFACES
-------------------------------- */

export interface StudentInsight {
  daily_objective: string;
  readiness_score: number;
  readiness_trend: 'up' | 'down';
  weakest_lever: {
    label: string;
    context: string;
  };
  streak: number;
}

interface DashboardSubject extends Subject {
  progress: number;
}

/* -----------------------------
   COMPONENT
-------------------------------- */

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SubjectCardComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {

  userName = 'Student';

  insights$!: Observable<StudentInsight | null>;
  subjects$!: Observable<DashboardSubject[]>;

  constructor(
    private gameplayService: GameplayService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setUserName();
    this.loadInsights();
    this.loadSubjects();
  }

  /* -----------------------------
     USER
  -------------------------------- */

  // private setUserName(): void {
  //   const user = this.auth.getUser();
  //   if (!user) return;

  //   this.userName =
  //     user.name ||
  //     user.username ||
  //     user.email?.split('@')[0] ||
  //     'Student';
  // }

  private setUserName(): void {
  const user = this.auth.getUser();
  if (!user) return;

  this.userName =
    user.name ||
    (user.email ? user.email.split('@')[0] : 'Student');
}


  /* -----------------------------
     INSIGHTS (COMMAND SURFACE)
  -------------------------------- */

  private loadInsights(): void {
    this.insights$ = this.gameplayService.getInsights().pipe(
      map(data => {
        if (!data) return null;

        const accuracy = Math.round(data.status?.recent_accuracy ?? 0);

        return {
          daily_objective:
            data.recommendation?.label ??
            'Revise weakest concept to prevent retention loss.',

          readiness_score: accuracy,

          readiness_trend:
            accuracy >= 70 ? 'up' : 'down',

          weakest_lever: {
            label:
              data.analysis?.weak_topic ??
              'Conceptual accuracy gap detected',
            context:
              data.analysis?.decay_risk ??
              'Retention risk increasing'
          },

          streak: data.status?.streak ?? 0
        } as StudentInsight;
      }),
      catchError(() => of(null))
    );
  }

  /* -----------------------------
     SUBJECTS (LEARNING PATH)
  -------------------------------- */

  private loadSubjects(): void {
    this.subjects$ = this.gameplayService.getSubjects().pipe(
      map(subjects =>
        subjects.map(subject => ({
          ...subject,
          progress: this.resolveProgress(subject)
        }))
      ),
      catchError(() => of([]))
    );
  }

  /* -----------------------------
     PROGRESS RESOLUTION LOGIC
     (UI-only, DB-safe)
  -------------------------------- */

  private resolveProgress(subject: Subject): number {
    const possibleValues = [
      (subject as any).progress,
      (subject as any).mastery,
      (subject as any).accuracy,
      (subject as any).completion
    ];

    const value = possibleValues.find(
      v => typeof v === 'number' && v >= 0
    );

    return Math.min(Math.round(value ?? 0), 100);
  }

  /* -----------------------------
     NAVIGATION
  -------------------------------- */

  onSelectSubject(subjectId: string): void {
    this.router.navigate(['/path', subjectId]);
  }
}
