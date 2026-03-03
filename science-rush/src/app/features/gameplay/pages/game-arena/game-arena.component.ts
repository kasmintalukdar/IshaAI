// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { GameplayService } from '../../../../core/services/gameplay.service';
// import { SoundService } from '../../../../core/services/sound.service'; 
// import { trigger, transition, style, animate } from '@angular/animations';

// @Component({
//   selector: 'app-game-arena',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './game-arena.component.html',
//   styleUrls: ['./game-arena.component.scss'],
//   animations: [
//     trigger('fadeSlide', [
//       transition(':enter', [
//         style({ opacity: 0, transform: 'translateY(20px)' }),
//         animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ opacity: 1, transform: 'translateY(0)' }))
//       ]),
//       transition(':leave', [
//         animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
//       ])
//     ])
//   ]
// })
// export class GameArenaComponent implements OnInit, OnDestroy {
//   // --- Data ---
//   topicId: string = '';
//   questions: any[] = [];
//   currentQ: any = null;
  
//   // --- State ---
//   status: 'LOADING' | 'PLAYING' | 'FEEDBACK' | 'SUMMARY' = 'LOADING';
//   mascotState: 'neutral' | 'thinking' | 'happy' | 'sad' | 'excited' = 'neutral';
  
//   // --- Metrics ---
//   currentIndex: number = 0;
//   sessionScore: number = 0;
//   streak: number = 0;
  
//   // --- Selection ---
//   selectedOptionId: string | null = null;
//   isProcessing: boolean = false;
//   isCorrect: boolean = false;
//   correctOptionId: string = '';

//   // 🟢 Time Tracking
//   private startTime: number = 0;
//   private readonly MAX_TIME_THRESHOLD = 60; 

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private gameplay: GameplayService,
//     private sound: SoundService
//   ) {}

//   ngOnInit(): void {
//     // 🟢 HYBRID LOADING LOGIC
//     this.route.queryParams.subscribe(params => {
      
//       const qIds = params['questionIds'];
//       const tId = params['topicId'];

//       if (qIds) {
//         // Handle "Mistake Review" (List of IDs)
//         const idsArray = qIds.split(',').filter((id: string) => id.trim() !== '');
//         this.loadQuestionsByIds(idsArray);
//       } 
//       else if (tId) {
//         // Handle Standard Topic
//         this.topicId = tId;
//         this.loadSession();
//       } 
//       else {
//         // Fallback to Route Param
//         const routeId = this.route.snapshot.paramMap.get('id');
//         if (routeId) {
//           this.topicId = routeId;
//           this.loadSession();
//         } else {
//           console.warn('No playable content found. Redirecting...');
//           this.status = 'SUMMARY'; 
//         }
//       }
//     });
//   }

//   loadQuestionsByIds(ids: string[]) {
//     this.status = 'LOADING';
//     this.gameplay.getQuestionsByIds(ids).subscribe({
//       next: (res: any) => {
//         const data = res.data || res; 
//         this.questions = Array.isArray(data) ? data : [];
        
//         if (this.questions.length > 0) {
//           this.startLevel();
//         } else {
//           this.status = 'SUMMARY'; 
//         }
//       },
//       error: (err: any) => {
//         console.error('Error loading specific questions:', err);
//         this.status = 'SUMMARY';
//       }
//     });
//   }

//   loadSession() {
//     this.status = 'LOADING';
//     this.gameplay.getQuestions(this.topicId).subscribe({
//       next: (res: any) => {
//         const data = res.data || res; 
//         this.questions = Array.isArray(data) ? data : [];
//         if (this.questions.length > 0) {
//           this.startLevel();
//         } else {
//           this.status = 'SUMMARY'; 
//         }
//       },
//       error: (err: any) => {
//         console.error('Error loading session:', err);
//         this.status = 'SUMMARY';
//       }
//     });
//   }

//   ngOnDestroy() {
//     // Cleanup if needed
//   }

//   startLevel() {
//     this.currentIndex = 0;
//     this.sessionScore = 0;
//     this.streak = 0;
//     this.loadQuestion(0);
//     this.status = 'PLAYING';
//   }

//   loadQuestion(index: number) {
//     if (!this.questions[index]) return;

//     this.currentQ = this.questions[index]; 
//     this.selectedOptionId = null;
//     this.isProcessing = false;
//     this.mascotState = 'thinking';

//     // Start Timer
//     this.startTime = Date.now();
//   }

//   getOptionLabel(index: number): string {
//     return String.fromCharCode(65 + index); // Returns A, B, C, D...
//   }

//   selectOption(optId: string) {
//     if (this.status !== 'PLAYING' || this.isProcessing) return;
    
//     const endTime = Date.now();
//     const elapsedSeconds = (endTime - this.startTime) / 1000; 
//     const finalTimeTaken = Math.min(elapsedSeconds, this.MAX_TIME_THRESHOLD);

//     this.selectedOptionId = optId;
//     this.isProcessing = true;
    
//     // Check Correctness
//     const correctOpt = this.currentQ.options.find((o: any) => o.isCorrect);
//     this.correctOptionId = correctOpt ? correctOpt.id : '';
//     this.isCorrect = (optId === this.correctOptionId);

//     if (this.isCorrect) {
//       this.mascotState = 'happy';
//       this.sound.play('success');
//       this.streak++;
//       // Score calculation includes marks from backend if available, else default to 10
//       const qMarks = this.currentQ.marks || 10;
//       this.sessionScore += qMarks + (this.streak > 1 ? 5 : 0);
      
//       if (this.streak >= 5) this.triggerCelebration();
//     } else {
//       this.mascotState = 'sad';
//       this.sound.play('error');
//       this.streak = 0;
//     }

//     this.gameplay.submitAnswer(this.currentQ._id, this.isCorrect, finalTimeTaken).subscribe({
//         next: () => {},
//         error: (err: any) => console.error('Failed to save progress', err)
//     });

//     this.status = 'FEEDBACK';
//   }

//   triggerCelebration() {
//     this.mascotState = 'excited';
//   }

//   continue() {
//     if (this.currentIndex < this.questions.length - 1) {
//       this.currentIndex++;
//       this.sound.play('click');
//       this.loadQuestion(this.currentIndex);
//       this.status = 'PLAYING';
//     } else {
//       this.finishSession();
//     }
//   }

//   finishSession() {
//     this.status = 'SUMMARY';
//     this.mascotState = 'excited';

//     if (this.sessionScore > 0) {
//       this.gameplay.updateStreak().subscribe({
//         next: (res: any) => console.log('🔥 Daily Streak Updated:', res.data?.streak),
//         error: (err: any) => console.error('Streak failed:', err)
//       });
//     }
//   }

//   exit() {
//     this.router.navigate(['/dashboard']);
//   }

//   get progressPercent(): number {
//     if (!this.questions.length) return 0;
//     return ((this.currentIndex) / this.questions.length) * 100;
//   }
// }



import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameplayService } from '../../../../core/services/gameplay.service';
import { SoundService } from '../../../../core/services/sound.service';
import { QuestionCardComponent } from '../../components/question-card/question-card.component';


import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-game-arena',
  standalone: true,
  imports: [
    CommonModule,
    QuestionCardComponent   // ✅ REQUIRED for child component
  ],
  templateUrl: './game-arena.component.html',
  styleUrls: ['./game-arena.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-20px)' })
        )
      ])
    ])
  ]
})
export class GameArenaComponent implements OnInit, OnDestroy {

  // ================= DATA =================
  topicId: string = '';
  questions: any[] = [];
  currentQ: any = null;

  // ================= STATE =================
  status: 'LOADING' | 'PLAYING' | 'FEEDBACK' | 'SUMMARY' = 'LOADING';
  mascotState: 'neutral' | 'thinking' | 'happy' | 'sad' | 'excited' = 'neutral';

  // ================= METRICS =================
  currentIndex: number = 0;
  sessionScore: number = 0;
  streak: number = 0;

  // ================= ANSWER STATE =================
  selectedOptionId: string | null = null;
  correctOptionId: string = '';
  isCorrect: boolean = false;
  isProcessing: boolean = false;

  // ================= TIMER =================
  private startTime: number = 0;
  private readonly MAX_TIME_THRESHOLD = 60;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameplay: GameplayService,
    private sound: SoundService
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {

      const qIds = params['questionIds'];
      const tId = params['topicId'];

      if (qIds) {
        const idsArray = qIds.split(',').filter((id: string) => id.trim() !== '');
        this.loadQuestionsByIds(idsArray);
      } 
      else if (tId) {
        this.topicId = tId;
        this.loadSession();
      } 
      else {
        const routeId = this.route.snapshot.paramMap.get('id');
        if (routeId) {
          this.topicId = routeId;
          this.loadSession();
        } else {
          this.status = 'SUMMARY';
        }
      }
    });
  }

  ngOnDestroy(): void {}

  // ================= LOAD QUESTIONS =================
  loadQuestionsByIds(ids: string[]) {
    this.status = 'LOADING';

    this.gameplay.getQuestionsByIds(ids).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.questions = Array.isArray(data) ? data : [];
        this.questions.length ? this.startLevel() : this.status = 'SUMMARY';
      },
      error: (err: any) => {
        console.error(err);
        this.status = 'SUMMARY';
      }
    });
  }

  loadSession() {
    this.status = 'LOADING';

    this.gameplay.getQuestions(this.topicId).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.questions = Array.isArray(data) ? data : [];
        this.questions.length ? this.startLevel() : this.status = 'SUMMARY';
      },
      error: (err: any) => {
        console.error(err);
        this.status = 'SUMMARY';
      }
    });
  }

  // ================= GAME FLOW =================
  startLevel() {
    this.currentIndex = 0;
    this.sessionScore = 0;
    this.streak = 0;
    this.loadQuestion(0);
    this.status = 'PLAYING';
  }

  loadQuestion(index: number) {
    if (!this.questions[index]) return;

    this.currentQ = this.questions[index];
    this.selectedOptionId = null;
    this.correctOptionId = '';
    this.isCorrect = false;
    this.isProcessing = false;
    this.mascotState = 'thinking';

    this.startTime = Date.now();
  }

  // ================= HANDLE ANSWER =================
  handleOptionSelected(optId: string) {
    if (this.status !== 'PLAYING' || this.isProcessing) return;

    const endTime = Date.now();
    const elapsedSeconds = (endTime - this.startTime) / 1000;
    const finalTimeTaken = Math.min(elapsedSeconds, this.MAX_TIME_THRESHOLD);

    this.selectedOptionId = optId;
    this.isProcessing = true;

    const correctOpt = this.currentQ?.options?.find((o: any) => o.isCorrect);
    this.correctOptionId = correctOpt?.id || '';
    this.isCorrect = optId === this.correctOptionId;

    if (this.isCorrect) {
      this.mascotState = 'happy';
      this.sound.play('success');
      this.streak++;

      const qMarks = this.currentQ.marks || 10;
      this.sessionScore += qMarks + (this.streak > 1 ? 5 : 0);

      if (this.streak >= 5) {
        this.mascotState = 'excited';
      }
    } else {
      this.mascotState = 'sad';
      this.sound.play('error');
      this.streak = 0;
    }

    this.gameplay.submitAnswer(
      this.currentQ._id,
      this.isCorrect,
      finalTimeTaken
    ).subscribe({
      error: (err: any) => console.error('Progress save failed', err)
    });

    this.status = 'FEEDBACK';
  }

  // ================= CONTINUE =================
  continue() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.sound.play('click');
      this.loadQuestion(this.currentIndex);
      this.status = 'PLAYING';
    } else {
      this.finishSession();
    }
  }

  finishSession() {
    this.status = 'SUMMARY';
    this.mascotState = 'excited';

    if (this.sessionScore > 0) {
      this.gameplay.updateStreak().subscribe({
        next: (res: any) =>
          console.log('🔥 Daily Streak Updated:', res.data?.streak),
        error: (err: any) =>
          console.error('Streak update failed:', err)
      });
    }
  }

  exit() {
    this.router.navigate(['/dashboard']);
  }

  // ================= HELPERS =================
  getCorrectAnswerText(): string {
    const correctOpt = this.currentQ?.options?.find(
      (o: any) => o.id === this.correctOptionId
    );
    return correctOpt?.text || '';
  }

  get progressPercent(): number {
    if (!this.questions.length) return 0;
    return ((this.currentIndex + 1) / this.questions.length) * 100;
  }
}
