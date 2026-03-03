// import { Component, OnInit } from '@angular/core';
// // ✅ FIX: Ensure ChapterAnalysis is imported here
// import { ReportService, ChapterAnalysis } from '../../services/report.service';

// @Component({
//   selector: 'app-chapter-wise-analysis',
//   templateUrl: './chapter-wise-analysis.component.html',
//   styleUrls: ['./chapter-wise-analysis.component.scss'],
//   standalone: false
// })
// export class ChapterWiseAnalysisComponent implements OnInit {
  
//   // ✅ usage of ChapterAnalysis
//   chapters: ChapterAnalysis[] = [];
//   selectedChapter: ChapterAnalysis | null = null;
//   isLoading = true;

//   constructor(private service: ReportService) {}

//   ngOnInit(): void {
//     this.service.getChapterAnalysis().subscribe(data => {
//       this.chapters = data || [];
//       if (this.chapters.length > 0) {
//         this.selectedChapter = this.chapters[0];
//       }
//       this.isLoading = false;
//     });
//   }

//   onChapterChange(event: any): void {
//     const chapterName = event.target.value;
//     this.selectedChapter = this.chapters.find(c => c._id === chapterName) || null;
//   }

//   getStatusColor(accuracy: number): string {
//     if (accuracy < 50) return '#F87171'; // Red
//     if (accuracy < 80) return '#FBBF24'; // Yellow/Orange
//     return '#34D399'; // Green
//   }

//   getBadgeClass(accuracy: number): string {
//     if (accuracy < 50) return 'badge-weak';
//     if (accuracy < 80) return 'badge-avg';
//     return 'badge-strong';
//   }

//   getRcPercent(val: number | undefined): number {
//     if (!val) return 0;
//     // Cap at 100%, assume max 10 errors for visualization scale
//     return Math.min((val / 10) * 100, 100); 
//   }
// }



// import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy  } from '@angular/core';
// import { ReportService, ChapterAnalysis } from '../../services/report.service';

// @Component({
//   selector: 'app-chapter-wise-analysis',
//   templateUrl: './chapter-wise-analysis.component.html',
//   styleUrls: ['./chapter-wise-analysis.component.scss'],
//   standalone: false
// })
// export class ChapterWiseAnalysisComponent implements OnInit , AfterViewInit, OnDestroy {

//   @ViewChild('chapterContainer') chapterContainer!: ElementRef;
//   private resizeObserver: ResizeObserver | null = null;
  
//   // Data State
//   allData: ChapterAnalysis[] = []; // Stores everything from API
//   subjects: string[] = [];         // Unique Subject Names
//   filteredChapters: ChapterAnalysis[] = []; // Chapters for selected subject

//   // Selection State
//   selectedSubject: string = '';
//   selectedChapter: ChapterAnalysis | null = null;
  
//   isLoading = true;

//   constructor(private service: ReportService) {}

//   ngOnInit(): void {
//     this.service.getChapterAnalysis().subscribe(data => {
//       this.allData = data || [];
      
//       // 1. Extract Unique Subjects
//       this.subjects = [...new Set(this.allData.map(item => item.subjectName))];

//       // 2. Initialize Selection (Select first subject & first chapter)
//       if (this.subjects.length > 0) {
//         this.selectedSubject = this.subjects[0];
//         this.filterChapters(); // This sets filteredChapters and selectedChapter
//       }

//       this.isLoading = false;
//     });
//   }

//  ngAfterViewInit() {
//     this.resizeObserver = new ResizeObserver(() => {
//       // Force redraw when this specific container gets its width
//       window.dispatchEvent(new Event('resize'));
//     });

//     if (this.chapterContainer) {
//       this.resizeObserver.observe(this.chapterContainer.nativeElement);
//     }
//   }


//   // Handle Subject Change
//   onSubjectChange(event: any): void {
//     this.selectedSubject = event.target.value;
//     this.filterChapters();
//   }

//   // Handle Chapter Change
//   onChapterChange(event: any): void {
//     const chapterName = event.target.value;
//     this.selectedChapter = this.filteredChapters.find(c => c._id === chapterName) || null;
//   }

//   // Helper: Filter Chapters based on Subject
//   private filterChapters(): void {
//     this.filteredChapters = this.allData.filter(
//       item => item.subjectName === this.selectedSubject
//     );

//     // Auto-select first chapter of the new subject
//     if (this.filteredChapters.length > 0) {
//       this.selectedChapter = this.filteredChapters[0];
//     } else {
//       this.selectedChapter = null;
//     }
//   }

//   // ... (Keep existing helpers: getStatusColor, getBadgeClass, getRcPercent)
//   getStatusColor(accuracy: number): string {
//     if (accuracy < 50) return '#F87171';
//     if (accuracy < 80) return '#FBBF24';
//     return '#34D399';
//   }

//   getBadgeClass(accuracy: number): string {
//     if (accuracy < 50) return 'badge-weak';
//     if (accuracy < 80) return 'badge-avg';
//     return 'badge-strong';
//   }

  
//   getRcPercent(val: number | undefined): number {
//     if (!val) return 0;
//     return Math.min((val / 10) * 100, 100); 
//   }

//   ngOnDestroy() {
//     if (this.resizeObserver) {
//       this.resizeObserver.disconnect();
//     }
//   }
// }





import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ReportService, ChapterAnalysis } from '../../services/report.service';

@Component({
  selector: 'app-chapter-wise-analysis',
  templateUrl: './chapter-wise-analysis.component.html',
  styleUrls: ['./chapter-wise-analysis.component.scss'],
  standalone: false
})
export class ChapterWiseAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chapterContainer') chapterContainer!: ElementRef;
  private resizeObserver: ResizeObserver | null = null;
  
  // Data State
  allData: ChapterAnalysis[] = [];
  subjects: string[] = [];
  filteredChapters: ChapterAnalysis[] = [];

  // Selection State
  selectedSubject: string = '';
  selectedChapter: ChapterAnalysis | null = null;
  
  isLoading = true;

  // Inject ChangeDetectorRef for safety
  constructor(private service: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.service.getChapterAnalysis().subscribe(data => {
      this.allData = data || [];
      
      // 1. Extract Unique Subjects
      this.subjects = [...new Set(this.allData.map(item => item.subjectName))];

      // 2. Initialize Selection
      if (this.subjects.length > 0) {
        this.selectedSubject = this.subjects[0];
        this.filterChapters();
      }

      this.isLoading = false;
      
      // 3. FORCE UPDATE: Manually trigger change detection and resize
      // This ensures the DOM renders the *ngIf content before we try to size it.
      this.cdr.detectChanges(); 
      
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50); // A tiny 50ms delay lets the DOM paint the new elements first
    });
  }

  ngAfterViewInit() {
    // Keep this to handle user resizing the browser window later
    this.resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });

    if (this.chapterContainer) {
      this.resizeObserver.observe(this.chapterContainer.nativeElement);
    }
  }

  // Handle Subject Change
  onSubjectChange(event: any): void {
    this.selectedSubject = event.target.value;
    this.filterChapters();
  }

  // Handle Chapter Change
  onChapterChange(event: any): void {
    const chapterName = event.target.value;
    // Ensure we match types (string vs string)
    this.selectedChapter = this.filteredChapters.find(c => c._id === chapterName) || null;
  }

  // Helper: Filter Chapters based on Subject
  private filterChapters(): void {
    this.filteredChapters = this.allData.filter(
      item => item.subjectName === this.selectedSubject
    );

    if (this.filteredChapters.length > 0) {
      this.selectedChapter = this.filteredChapters[0];
    } else {
      this.selectedChapter = null;
    }
  }

  // --- Visual Helpers ---
  getStatusColor(accuracy: number): string {
    if (accuracy < 50) return '#F87171'; // Red
    if (accuracy < 80) return '#FBBF24'; // Yellow
    return '#34D399';                    // Green
  }

  getBadgeClass(accuracy: number): string {
    if (accuracy < 50) return 'badge-weak';
    if (accuracy < 80) return 'badge-avg';
    return 'badge-strong';
  }

  getRcPercent(val: number | undefined): number {
    if (!val) return 0;
    return Math.min((val / 10) * 100, 100); 
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}