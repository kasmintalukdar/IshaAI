import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { Router } from '@angular/router';
import { GameplayService } from '../../../../core/services/gameplay.service';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, timeout, catchError, of } from 'rxjs';

interface DailyTask {
  time: string;
  type: 'warmup' | 'deep-work' | 'review';
  title: string;
  subtitle: string;
  status: 'active' | 'locked' | 'completed';
  actionLabel?: string;
  topicId?: string;
  questionIds?: string[];
  progress?: number;
}

interface PlanStats {
  totalSolved: number;
  recentAccuracy: number;
  questionsThisWeek: number;
  mistakesThisWeek: number;
  strongestTopic: string | null;
  strongestProgress: number;
  weakestTopic: string | null;
  weakestProgress: number;
  topicsTracked: number;
}

interface Formula {
  id: string;
  title: string;
  expression: string;
  variables: string[];
  subject: string;
  topic: string;
  lastUsedDate: Date;
  masteryLevel: 'high' | 'medium' | 'low';
  masteryScore: number;
  useCount: number;
}

@Component({
  selector: 'app-ai-tutor',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  templateUrl: './ai-tutor.component.html',
  styleUrl: './ai-tutor.component.scss'
})
export class AiTutorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  currentDate = new Date();
  activeTab: 'strategy' | 'formulas' = 'strategy';

  // Subject selector for plan
  availableSubjects: any[] = [];
  planSubjectId: string = '';

  // Formula filters
  selectedSubject: string = 'All';
  selectedTopic: string = 'All';

  // Dynamic AI summary — generated from actual stats
  greeting = '';
  analysis = '';
  strategy = '';

  dailyPlan: DailyTask[] = [];
  stats: PlanStats = {
    totalSolved: 0, recentAccuracy: 0, questionsThisWeek: 0,
    mistakesThisWeek: 0, strongestTopic: null, strongestProgress: 0,
    weakestTopic: null, weakestProgress: 0, topicsTracked: 0
  };

  allFormulas: Formula[] = [];
  formulasLoaded = false;
  formulasLoading = false;

  constructor(
    private router: Router,
    private gameplayService: GameplayService
  ) {}

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.gameplayService.getSubjects().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (subs: any[]) => {
        this.availableSubjects = subs || [];
        // Auto-select first subject
        if (this.availableSubjects.length > 0) {
          this.planSubjectId = this.availableSubjects[0]._id || this.availableSubjects[0].name;
        }
        this.fetchDailyPlan();
      },
      error: () => {
        this.fetchDailyPlan();
      }
    });
  }

  onSubjectChange(subjectId: string) {
    this.planSubjectId = subjectId;
    this.fetchDailyPlan();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: 'strategy' | 'formulas') {
    this.activeTab = tab;
    if (tab === 'formulas' && !this.formulasLoaded) {
      this.fetchFormulas();
    }
  }

  fetchDailyPlan() {
    this.loading = true;
    this.gameplayService.getDailyPlans(this.planSubjectId || undefined).pipe(
      timeout(12000),
      catchError(err => {
        console.error('Plan fetch error:', err);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        if (!data || !data.warmup) {
          this.useFallbackPlan();
        } else {
          this.stats = data.stats || this.stats;
          this.buildSummary(data);
          this.dailyPlan = [
            {
              time: 'Start', type: 'warmup',
              title: data.warmup?.topic || 'Basics',
              subtitle: data.warmup?.note || 'Get ready',
              status: 'active', actionLabel: 'Start Session',
              topicId: data.warmup?.topicId,
              progress: data.warmup?.progress
            },
            {
              time: 'Focus', type: 'deep-work',
              title: data.deepWork?.topic || 'Core',
              subtitle: data.deepWork?.note || 'Focus now',
              status: 'active', actionLabel: 'Start Session',
              topicId: data.deepWork?.topicId,
              questionIds: data.deepWork?.questionIds,
              progress: data.deepWork?.progress
            },
            {
              time: 'Review', type: 'review',
              title: data.review?.topic || 'Retention',
              subtitle: data.review?.note || 'Keep it fresh',
              status: data.review?.topic === 'None' ? 'completed' : 'active',
              actionLabel: data.review?.topic === 'None' ? undefined : 'Start Session',
              topicId: data.review?.topicId,
              progress: data.review?.progress
            }
          ];
        }
        this.loading = false;
      }
    });
  }

  buildSummary(data: any) {
    const s = this.stats;

    // Greeting
    if (s.recentAccuracy >= 80) {
      this.greeting = "You're on fire! Keep this momentum going.";
    } else if (s.recentAccuracy >= 50) {
      this.greeting = "Good progress this week. Let's sharpen your weak spots.";
    } else if (s.questionsThisWeek > 0) {
      this.greeting = "Every mistake is a lesson. Today's plan is built to help.";
    } else {
      this.greeting = "Welcome back! Here's your personalized study plan.";
    }

    // Analysis
    const parts: string[] = [];
    if (s.questionsThisWeek > 0) {
      parts.push(`${s.questionsThisWeek} questions this week at ${s.recentAccuracy}% accuracy`);
    }
    if (s.strongestTopic) {
      parts.push(`Strongest: ${s.strongestTopic} (${s.strongestProgress}%)`);
    }
    if (s.weakestTopic) {
      parts.push(`Needs work: ${s.weakestTopic} (${s.weakestProgress}%)`);
    }
    this.analysis = parts.length > 0 ? parts.join(' · ') : `${s.totalSolved} questions solved so far.`;

    // Strategy
    if (data.deepWork?.topic === 'Mistake Review') {
      this.strategy = `Priority: Fix ${s.mistakesThisWeek} recent mistakes before moving forward.`;
    } else if (s.weakestTopic && s.weakestProgress < 40) {
      this.strategy = `Focus on ${s.weakestTopic} today — it needs the most attention.`;
    } else if (s.recentAccuracy >= 80) {
      this.strategy = `You're doing great. Let's push into harder territory.`;
    } else {
      this.strategy = `Follow the plan below: warm up, deep work, then review.`;
    }
  }

  useFallbackPlan() {
    this.greeting = 'Welcome! Start solving questions to unlock your personalized plan.';
    this.analysis = 'No activity data yet.';
    this.strategy = 'Begin with any topic to get started.';
    this.dailyPlan = [
      { time: 'Start', type: 'warmup', title: 'Quick Start', subtitle: 'Pick any topic', status: 'active', actionLabel: 'Start Session' },
      { time: 'Focus', type: 'deep-work', title: 'Explore', subtitle: 'Try a new chapter', status: 'active', actionLabel: 'Start Session' },
      { time: 'Review', type: 'review', title: 'Review', subtitle: 'Nothing yet', status: 'locked' }
    ];
  }

  fetchFormulas() {
    this.formulasLoading = true;
    this.gameplayService.getFormulas().pipe(
      timeout(10000),
      catchError(err => {
        console.error('Formula fetch error:', err);
        return of({ data: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (Array.isArray(data)) {
          this.allFormulas = data.map((f: any) => ({
            id: f.id || f._id,
            title: f.title || 'Formula',
            expression: f.expression || '',
            variables: f.variables || [],
            subject: f.subject || 'General',
            topic: f.topic || 'General',
            lastUsedDate: f.lastUsedDate ? new Date(f.lastUsedDate) : new Date(),
            masteryLevel: f.masteryLevel || 'medium',
            masteryScore: f.masteryScore || 0,
            useCount: f.useCount || 0
          }));
        }
        this.formulasLoaded = true;
        this.formulasLoading = false;
      }
    });
  }

  startTask(task: DailyTask) {
    if (task.status === 'locked' || task.status === 'completed') return;
    const queryParams: any = { mode: task.type };
    if (task.questionIds && task.questionIds.length > 0) {
      queryParams.questionIds = task.questionIds.join(',');
    } else if (task.topicId) {
      queryParams.topicId = task.topicId;
    }
    this.router.navigate(['/game/play'], { queryParams });
  }

  selectSubject(sub: string) {
    this.selectedSubject = sub;
    this.selectedTopic = 'All';
  }

  get subjects(): string[] {
    if (!this.allFormulas.length) return ['All'];
    const subs = new Set(this.allFormulas.map(f => f.subject));
    return ['All', ...Array.from(subs)];
  }

  get topics(): string[] {
    if (this.selectedSubject === 'All') return [];
    const tops = new Set(
      this.allFormulas.filter(f => f.subject === this.selectedSubject).map(f => f.topic)
    );
    return ['All', ...Array.from(tops)];
  }

  get filteredFormulas(): Formula[] {
    return this.allFormulas.filter(f => {
      const matchSubject = this.selectedSubject === 'All' || f.subject === this.selectedSubject;
      const matchTopic = this.selectedTopic === 'All' || f.topic === this.selectedTopic;
      return matchSubject && matchTopic;
    });
  }

  get formulaStats() {
    const total = this.allFormulas.length;
    const low = this.allFormulas.filter(f => f.masteryLevel === 'low').length;
    const high = this.allFormulas.filter(f => f.masteryLevel === 'high').length;
    return { total, low, high };
  }

  getMasteryLabel(level: string): string {
    if (level === 'high') return 'Mastered';
    if (level === 'medium') return 'Learning';
    return 'Weak';
  }
}
