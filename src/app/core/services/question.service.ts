import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Question, UserStats } from '../models/question.model';
import { firstValueFrom } from 'rxjs';

const STATS_KEY = 'aws_ai_user_stats';
const WRONG_URLS_KEY = 'aws_ai_wrong_urls';
const HISTORY_KEY = 'aws_ai_answer_history';

export interface AnswerHistoryItem {
  selected: string[];
  isCorrect: boolean;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly http = inject(HttpClient);

  readonly allQuestions = signal<Question[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly failedUrls = signal<Set<string>>(this.loadFailedUrls());
  readonly answerHistory = signal<Record<string, AnswerHistoryItem>>(this.loadHistory());

  readonly totalQuestions = computed(() => this.allQuestions().length);
  readonly answeredCount = computed(() => Object.keys(this.answerHistory()).length);
  readonly failedCount = computed(() => this.failedUrls().size);
  readonly correctCount = computed(() => {
    let count = 0;
    for (const item of Object.values(this.answerHistory())) {
      if (item.isCorrect) count++;
    }
    return count;
  });
  readonly accuracyPercentage = computed(() => {
    const total = this.answeredCount();
    if (total === 0) return 0;
    return Math.round((this.correctCount() / total) * 100);
  });

  constructor() {
    void this.loadQuestions();
  }

  async loadQuestions(): Promise<Question[]> {
    if (this.allQuestions().length > 0) return this.allQuestions();
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load questions.json from public directory
      const data = await firstValueFrom(this.http.get<Question[]>('questions.json'));
      this.allQuestions.set(data || []);
      return data || [];
    } catch (err) {
      console.error('Failed to load questions:', err);
      this.error.set('Could not load exam questions. Check questions.json in public folder.');
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  recordAnswer(question: Question, selected: string[], isCorrect: boolean): void {
    const key = question.url || question.question_no;

    // Update history
    const history = { ...this.answerHistory() };
    history[key] = {
      selected,
      isCorrect,
      timestamp: Date.now(),
    };
    this.answerHistory.set(history);
    this.saveHistory(history);

    // Update failed set
    const failed = new Set(this.failedUrls());
    if (isCorrect) {
      failed.delete(key);
    } else {
      failed.add(key);
    }
    this.failedUrls.set(failed);
    this.saveFailedUrls(failed);
  }

  getFailedQuestions(): Question[] {
    const failedSet = this.failedUrls();
    return this.allQuestions().filter((q) => failedSet.has(q.url || q.question_no));
  }

  findQuestionIndexByNumber(num: number): number {
    return this.allQuestions().findIndex((q, i) => {
      const match = q.question_no.match(/question\s+(\d+)/i);
      if (match && Number(match[1]) === num) return true;
      return i + 1 === num;
    });
  }

  resetProgress(): void {
    this.answerHistory.set({});
    this.failedUrls.set(new Set());
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(WRONG_URLS_KEY);
    localStorage.removeItem(STATS_KEY);
  }

  private loadFailedUrls(): Set<string> {
    try {
      const raw = localStorage.getItem(WRONG_URLS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveFailedUrls(set: Set<string>): void {
    try {
      localStorage.setItem(WRONG_URLS_KEY, JSON.stringify(Array.from(set)));
    } catch {
      /* ignore storage quota errors */
    }
  }

  private loadHistory(): Record<string, AnswerHistoryItem> {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveHistory(history: Record<string, AnswerHistoryItem>): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* ignore */
    }
  }
}
