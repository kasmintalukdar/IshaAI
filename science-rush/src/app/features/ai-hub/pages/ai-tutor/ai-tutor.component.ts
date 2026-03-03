import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { Router } from '@angular/router';
import { GameplayService } from '../../../../core/services/gameplay.service';
import { FormsModule } from '@angular/forms';

// --- Interfaces ---
interface DailyTask {
  time: string;
  type: 'warmup' | 'deep-work' | 'review';
  title: string;
  subtitle: string;
  status: 'active' | 'locked' | 'completed';
  actionLabel?: string;
  aiNote?: string;
  topicId?: string;
  questionIds?: string[];
}

interface Formula {
  id: string;
  title: string;
  expression: string;
  subject: string;
  topic: string;
  lastUsedDate: Date;
  masteryLevel: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-ai-tutor',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  templateUrl: './ai-tutor.component.html',
  styleUrl: './ai-tutor.component.scss'
})
export class AiTutorComponent implements OnInit {
  
  loading = true;
  currentDate = new Date();
  
  // --- View State ---
  activeTab: 'strategy' | 'formulas' = 'strategy';
  
  // --- Filter State ---
  selectedSubject: string = 'All';
  selectedTopic: string = 'All';
  
  // --- Data ---
  llmSummary = {
    greeting: "Hello Student!",
    analysis: "I've analyzed your recent performance.",
    strategy: "Here is your optimized plan for today."
  };
  
  dailyPlan: DailyTask[] = [];
  allFormulas: Formula[] = []; // Initialize empty to prevent UI errors

  constructor(
    private router: Router,
    private gameplayService: GameplayService
  ) {}

  ngOnInit() {
    this.fetchDailyPlan();
    this.fetchFormulas();
  }

  // --- 1. Fetch Daily Plan ---
  fetchDailyPlan() {
    this.loading = true;
    this.gameplayService.getDailyPlans().subscribe({
      next: (data) => {
        
        // Check if data is valid, otherwise use fallback
        if (!data || !data.warmup) {
           this.useMockPlan();
        } else {
           // Update LLM Text if available
           if (data.deepWork && data.deepWork.topic === 'Mistake Review') {
             this.llmSummary.strategy = `I've created a <span class='highlight bad'>Mistake Repair Session</span> to fix your recent errors.`;
           }

           this.dailyPlan = [
            {
              time: 'Start',
              type: 'warmup',
              title: 'Warm Up: ' + (data.warmup?.topic || 'Basics'),
              subtitle: data.warmup?.note || 'Get ready',
              status: 'active',
              actionLabel: 'Start Session ➜',
              topicId: data.warmup?.topicId
            },
            {
              time: 'Focus',
              type: 'deep-work',
              title: 'Deep Work: ' + (data.deepWork?.topic || 'Core'),
              subtitle: data.deepWork?.note || 'Focus now',
              status: 'active',
              topicId: data.deepWork?.topicId,
              questionIds: data.deepWork?.questionIds 
            },
            {
              time: 'Review',
              type: 'review',
              title: 'Review: ' + (data.review?.topic || 'Retention'),
              subtitle: data.review?.note || 'Keep it fresh',
              status: 'active', 
              topicId: data.review?.topicId
            }
          ];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Plan Fetch Error:', err);
        this.useMockPlan(); // Fallback on error
        this.loading = false;
      }
    });
  }

  useMockPlan() {
    this.dailyPlan = [
      { time: 'Start', type: 'warmup', title: 'Warm Up', subtitle: 'Basics', status: 'active', actionLabel: 'Start Session ➜' },
      { time: 'Focus', type: 'deep-work', title: 'Deep Work', subtitle: 'Core Concept', status: 'active' },
      { time: 'End', type: 'review', title: 'Review', subtitle: 'Retention', status: 'locked' }
    ];
  }

  // --- 2. Fetch Formulas ---
  fetchFormulas() {
    this.gameplayService.getFormulas().subscribe({
      next: (res: any) => {
        // Handle response wrapping { status: 'success', data: [...] }
        const data = res.data || res; 
        
        if (Array.isArray(data)) {
          this.allFormulas = data.map((f: any) => ({
            id: f._id || f.id,
            title: f.title || 'Formula', 
            expression: f.expression || 'x = ?',
            subject: f.subject || 'General',
            topic: f.topic || 'General',
            lastUsedDate: f.last_used ? new Date(f.last_used) : new Date(),
            masteryLevel: f.mastery_level || 'medium'
          }));
        } else {
          this.allFormulas = [];
        }
      },
      error: (err) => {
        console.error('Formula Fetch Error:', err);
        // Fallback: If no backend, show empty state or mock data
        this.allFormulas = []; 
      }
    });
  }

  // --- 3. Actions ---
  startTask(task: DailyTask) {
    if (task.status !== 'locked') {
      const queryParams: any = { mode: task.type };
      
      // Handle Mistake Review (List of IDs)
      if (task.questionIds && task.questionIds.length > 0) {
        queryParams.questionIds = task.questionIds.join(',');
      } 
      // Handle Standard Topic
      else if (task.topicId) {
        queryParams.topicId = task.topicId;
      }

      this.router.navigate(['/game/play'], { queryParams });
    }
  }

  selectSubject(sub: string) {
    this.selectedSubject = sub;
    this.selectedTopic = 'All'; // Reset topic when subject changes
  }

  // --- 4. Getters (Filter Logic) ---
  
  // Get unique subjects from the formula list
  get subjects(): string[] {
    if (!this.allFormulas || this.allFormulas.length === 0) return ['All'];
    const subs = new Set(this.allFormulas.map(f => f.subject));
    return ['All', ...Array.from(subs)];
  }

  // Get unique topics for the selected subject
  get topics(): string[] {
    if (this.selectedSubject === 'All' || !this.allFormulas) return [];
    
    const relevantFormulas = this.allFormulas.filter(f => f.subject === this.selectedSubject);
    const tops = new Set(relevantFormulas.map(f => f.topic));
    return ['All', ...Array.from(tops)];
  }

  // Apply filters to the list
  get filteredFormulas(): Formula[] {
    if (!this.allFormulas) return [];
    
    return this.allFormulas.filter(f => {
      const matchSubject = this.selectedSubject === 'All' || f.subject === this.selectedSubject;
      const matchTopic = this.selectedTopic === 'All' || f.topic === this.selectedTopic;
      return matchSubject && matchTopic;
    });
  }
}