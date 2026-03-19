
//         this.aiData = results.persona;
//         this.masteryData = results.mastery;
//         this.examData = results.exam;
//         if (results.mastery?.weakest_topic_id) {
//           this.weakestTopicId = results.mastery.weakest_topic_id;
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         console.error(err);
//         this.error = "Neural Core Sync Failed.";
//         this.loading = false;
//       }
//     });
//   }

//   // --- AI #4 & SUMMARY METHODS ---
//   loadBurnoutStatus() {
//     this.http.get(`${environment.apiUrl}/ai/burnout-status`).subscribe({
//       next: (res: any) => this.burnoutStatus = res,
//       error: (err) => console.error("Burnout fetch failed", err)
//     });
//   }

//   fetchSummary() {
//     this.summaryLoading = true;
//     this.http.get(`${environment.apiUrl}/ai/summary`).subscribe({
//       next: (res: any) => {
//         this.aiSummary = res.summary;
//         this.summaryLoading = false;
//       },
//       error: () => this.summaryLoading = false
//     });
//   }

//   // --- INSIGHT MODAL LOGIC ---
//   openPersonaDetails() {
//     if (!this.aiData) return;
//     const p = this.aiData.persona;
//     let recs = p === 'Impulsive_Guesser' ? ["Wait 5s before answering."] : ["Keep practicing."];
//     this.selectedInsight = {
//       title: "Cognitive Style", score: p, type: 'persona', analysis: [], recommendations: recs
//     };
//   }

//   openMasteryDetails() {
//     if (!this.masteryData) return;
//     this.selectedInsight = {
//       title: "Mastery", score: this.masteryScore, type: 'mastery', analysis: [], recommendations: []
//     };
//   }

//   openExamDetails() {
//     if (!this.examData) return;
//     this.selectedInsight = {
//       title: "Exam Projection", score: this.predictedScore + "%", type: 'exam', analysis: [], recommendations: []
//     };
//   }

//   startPractice() {
//     this.closeModal();
//     if (this.weakestTopicId) this.router.navigate(['/game/play', this.weakestTopicId]);
//     else this.router.navigate(['/subject-path']);
//   }

//  fetchExamData() {
//     this.http.get<any>(`${environment.apiUrl}/ai/exam-prediction`).subscribe({
//       next: (res) => {
//         if (res.success) {
//           // Map the JSON keys exactly as they appear in your provided response
//           this.examData = {
//             predicted_score: res.predicted_score,
//             syllabus_completion: res.syllabus_completion || 0
//           };
//           this.examInsights = res.insights || [];
//           console.log("Current Insight to Display:", this.currentInsight);
//         }
//       },
//       error: (err) => console.error("API Error", err)
//     });
//   }

//   nextInsight(event: Event) {
//     event.stopPropagation();
//     if (this.examInsights.length > 1) {
//       this.currentInsightIndex = (this.currentInsightIndex + 1) % this.examInsights.length;
//     }
//   }

//   // New: Jump directly to the chapter suggested by the AI
//   jumpToChapter(chapterId: string) {
//     if (chapterId) {
//       this.router.navigate(['/game/play', chapterId]);
//     }
//   }


//   closeModal() { this.selectedInsight = null; }

//   getMascotImage(persona: string): string {
//     if (persona === 'Master' || persona === 'Deep_Thinker') return 'assets/images/mascots/happy.svg';
//     return 'assets/images/mascots/thinking.svg';
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { SharedModule } from '../../../../shared/shared.module';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

// Define an Interface for the Insight Modal
interface AiInsight {
  title: string;
  score: string | number;
  type: 'persona' | 'mastery' | 'exam';
  analysis: {
    label: string;
    value: string;
    status: 'good' | 'warning' | 'bad';
  }[];
  recommendations: string[];
}

@Component({
  selector: 'app-ai-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './ai-dashboard.component.html',
  styleUrl: './ai-dashboard.component.scss',
})
export class AiDashboardComponent implements OnInit {
  // Core Data Objects
  aiData: any = null;
  masteryData: any = null;
  examData: any = { predicted_score: 0, syllabus_completion: 0 };
  burnoutStatus: any = null;
  aiSummary: any = null;

  weakestTopicId: string | null = null;

  loading = true;
  summaryLoading = false;
  currentInsightIndex = 0;
  examInsights: any[] = [];
  Math = Math;

  // Helper Arrays for UI Segments
  examSegments = [0, 1, 2, 3, 4];
  burnoutSegments = [0, 1, 2, 3];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.refreshAllData();
  }

  // --- Getters for Template Mapping ---
  get persona(): string { return this.aiData?.persona || 'Calculating...'; }
  get masteryScore(): number { return this.masteryData?.mastery_score || 0; }
  get masteryLevel(): string { return this.masteryData?.level || 'Novice'; }
  get predictedScore(): number { return parseFloat(this.examData?.predicted_score || '0'); }
  get grade(): string {
    const s = this.predictedScore;
    if (s >= 80) return 'A';
    if (s >= 60) return 'B';
    if (s >= 40) return 'C';
    return 'D';
  }
  get currentInsight() {
    return (this.examInsights && this.examInsights.length > 0) ? this.examInsights[this.currentInsightIndex] : null;
  }
  get riskLevel(): string {
    const stress = this.burnoutStatus?.stress_level || 0;
    if (stress > 0.75) return 'High';
    if (stress > 0.4) return 'Medium';
    return 'Low';
  }

  // Make sure Router is injected in your constructor: 
  // constructor(private router: Router) {}

  openIshaaChat() {
    this.router.navigate(['/ai-hub/ishaa-v2']);
  }
  // --- Data Fetching ---
  refreshAllData() {
    this.loading = true;
    forkJoin({
      persona: this.http.get(`${environment.apiUrl}/ai/profile`),
      mastery: this.http.get(`${environment.apiUrl}/ai/mastery`),
      exam: this.http.get(`${environment.apiUrl}/ai/exam-prediction`),
      burnout: this.http.get(`${environment.apiUrl}/ai/burnout-status`),
      summary: this.http.get(`${environment.apiUrl}/ai/summary`)
    }).subscribe({
      next: (res: any) => {
        this.aiData = res.persona;
        this.masteryData = res.mastery;
        this.examData = res.exam;
        this.examInsights = res.exam.insights || [];
        this.burnoutStatus = res.burnout;
        this.aiSummary = res.summary.summary;
        this.loading = false;
      },
      error: (err) => {
        console.error("Neural Sync Failed", err);
        this.loading = false;
      },
    });
  }

  nextInsight(event: Event) {
    event.stopPropagation();
    if (this.examInsights.length > 1) {
      this.currentInsightIndex = (this.currentInsightIndex + 1) % this.examInsights.length;
    }
  }

  getMascotImage(persona: string): string {
    const p = persona?.toLowerCase() || '';
    if (p.includes('master') || p.includes('thinker')) {
      return 'assets/images/mascots/happy.svg'; // High performance mascot
    }
    if (p.includes('struggler') || p.includes('impulsive')) {
      return 'assets/images/mascots/thinking.svg'; // Analyzing/Warning mascot
    }
    return 'assets/images/mascots/thinking.svg'; // Default
  }

  get avgTimePerQuestion(): number {
    const ratio = this.masteryData?.ai_data?.time_efficiency_ratio || 0;
    return Math.round(ratio * 60);
  }

  jumpToChapter(chapterId: string) {
    if (chapterId) this.router.navigate(['/game/play', chapterId]);
  }
}
