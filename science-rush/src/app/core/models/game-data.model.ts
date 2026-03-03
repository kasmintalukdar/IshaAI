export type ChapterStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED';
export type Difficulty = 'A1' | 'B1' | 'C1' | 'D1';

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalChapters: number;
  completedChapters: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  orderIndex: number;
  status: ChapterStatus;
  stars: number;
  progress: number; // <--- NEW: 0 to 100 for the ring
  totalQuestions: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  chapterId: string;
  text: string;
  difficulty: Difficulty;
  year?: number;      // ✅ Add this
  marks?: number;     // ✅ Add this
  image_url?: string; 
  options: QuestionOption[];
  explanation: string;
}