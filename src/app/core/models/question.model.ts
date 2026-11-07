export interface Question {
  url: string;
  question_no: string;
  question: string;
  options: Record<string, string>;
  images?: string[];
  is_hotspot?: boolean;
  discussion?: string[];
  vote_counts?: Record<string, number>;
  most_voted?: string;
  community_answer?: string;
  correct_answer: string;
}

export type ScreenMode = 'home' | 'exam-setup' | 'practice' | 'exam' | 'results' | 'review';

export interface ExamConfig {
  numQuestions: number;
  passThreshold: number; // e.g. 70 (%)
}

export interface ExamResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  scorePercentage: number;
  scaledScore: number; // e.g. 750 (out of 1000)
  passed: boolean;
  passThreshold: number;
  elapsedSeconds: number;
  wrongQuestions: Question[];
}

export interface UserStats {
  answeredCount: number;
  correctCount: number;
  failedCount: number;
  failedQuestionUrls: string[];
}
