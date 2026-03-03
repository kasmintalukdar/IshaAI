import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Subject, Chapter, Question } from '../models/game-data.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {


  // NEW: Save current question index (Resume Feature)
  saveProgress(chapterId: string, questionIndex: number, totalQuestions: number) {
    const chapter = this.chapters.find(c => c.id === chapterId);
    if (chapter) {
      // Calculate % based on how far they are
      const progress = Math.round((questionIndex / totalQuestions) * 100);
      
      // Only update if it's not already completed
      if (chapter.status !== 'COMPLETED') {
        chapter.progress = progress;
        this.saveState(); // Save to LocalStorage
      }
      
      // Save specific bookmark for this chapter
      localStorage.setItem(`bookmark_${chapterId}`, questionIndex.toString());
    }
  }

  // NEW: Get saved bookmark
  getBookmark(chapterId: string): number {
    const saved = localStorage.getItem(`bookmark_${chapterId}`);
    return saved ? parseInt(saved, 10) : 0;
  }
  
  // --- INITIAL DATA SEED ---
  private subjects: Subject[] = [
    { id: 'sub_phy', name: 'Physics', icon: 'assets/images/subjects/physics.svg', color: '#ffc800', totalChapters: 5, completedChapters: 0 },
    { id: 'sub_chem', name: 'Chemistry', icon: 'assets/images/subjects/chemistry.svg', color: '#ff4b4b', totalChapters: 5, completedChapters: 0 },
    { id: 'sub_math', name: 'Maths', icon: 'assets/images/subjects/math.svg', color: '#1cb0f6', totalChapters: 5, completedChapters: 0 },
    { id: 'sub_bio', name: 'Biology', icon: 'assets/images/subjects/biology.svg', color: '#58cc02', totalChapters: 5, completedChapters: 0 }
  ];

  // We store chapters in a flat list for simplicity in this mock
  private chapters: Chapter[] = [
    { id: 'c1', subjectId: 'sub_phy', title: 'Electrostatics', orderIndex: 1, status: 'ACTIVE', stars: 0, progress: 0, totalQuestions: 3 },
    { id: 'c2', subjectId: 'sub_phy', title: 'Current Electricity', orderIndex: 2, status: 'ACTIVE', stars: 0, progress: 0, totalQuestions: 3 },
    { id: 'c3', subjectId: 'sub_phy', title: 'Magnetism', orderIndex: 3, status: 'ACTIVE', stars: 0, progress: 0, totalQuestions: 3 },
    { id: 'c4', subjectId: 'sub_phy', title: 'Optics', orderIndex: 4, status: 'ACTIVE', stars: 0, progress: 0, totalQuestions: 3 },
    { id: 'c5', subjectId: 'sub_phy', title: 'Modern Physics', orderIndex: 5, status: 'ACTIVE', stars: 0, progress: 0, totalQuestions: 3 },
  ];

  constructor() {
    this.loadState(); // Load from LocalStorage if exists
  }

  // --- API METHODS ---

  getSubjects(): Observable<Subject[]> {
    return of(this.subjects).pipe(delay(500));
  }

  getChapters(subjectId: string): Observable<Chapter[]> {
    const subjectChapters = this.chapters.filter(c => c.subjectId === subjectId);
    return of(subjectChapters).pipe(delay(400));
  }

  getQuestions(chapterId: string): Observable<Question[]> {
    // Generate dummy questions dynamically for any chapter
    const questions: Question[] = Array.from({ length: 3 }).map((_, i) => ({
      id: `q_${chapterId}_${i}`,
      chapterId: chapterId,
      text: `Mock Question ${i + 1} for ${chapterId}?`,
      difficulty: 'A1',
      options: [
        { id: 'a', text: 'Correct Answer', isCorrect: true },
        { id: 'b', text: 'Wrong Option 1', isCorrect: false },
        { id: 'c', text: 'Wrong Option 2', isCorrect: false },
        { id: 'd', text: 'Wrong Option 3', isCorrect: false }
      ].sort(() => Math.random() - 0.5), // Shuffle options
      explanation: 'This is a mock explanation because the backend is not connected yet.'
    }));
    return of(questions).pipe(delay(600));
  }

  // --- STATE MANAGEMENT (The "Game Engine") ---

completeChapter(chapterId: string, stars: number) {
    // ... existing logic ...
    const chapterIndex = this.chapters.findIndex(c => c.id === chapterId);
    if (chapterIndex > -1) {
      this.chapters[chapterIndex].status = 'COMPLETED';
      this.chapters[chapterIndex].stars = stars;
      this.chapters[chapterIndex].progress = 100;
      
      // Unlock next
      const next = this.chapters.find(c => c.orderIndex === this.chapters[chapterIndex].orderIndex + 1);
      if (next) next.status = 'ACTIVE';
      
      this.saveState();
      
      // REMOVE BOOKMARK so next time it starts fresh or stays complete
      localStorage.removeItem(`bookmark_${chapterId}`);
    }
  }


  private saveState() {
    localStorage.setItem('game_state_subjects', JSON.stringify(this.subjects));
    localStorage.setItem('game_state_chapters', JSON.stringify(this.chapters));
  }

  private loadState() {
    const savedSubjects = localStorage.getItem('game_state_subjects');
    const savedChapters = localStorage.getItem('game_state_chapters');

    if (savedSubjects) this.subjects = JSON.parse(savedSubjects);
    if (savedChapters) this.chapters = JSON.parse(savedChapters);
  }
  
  // Dev Helper: Reset progress
  resetProgress() {
    localStorage.clear();
    window.location.reload();
  }
}