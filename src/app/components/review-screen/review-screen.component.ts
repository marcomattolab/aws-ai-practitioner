import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../core/models/question.model';

@Component({
  selector: 'app-review-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-screen.component.html',
  styleUrl: './review-screen.component.css',
})
export class ReviewScreenComponent {
  readonly questions = input.required<Question[]>();
  readonly userAnswers = input.required<Record<number, string[]>>();

  readonly back = output<void>();

  readonly currentIndex = signal<number>(0);
  readonly showDiscussion = signal<boolean>(false);

  readonly currentQuestion = computed<Question | null>(() => {
    const list = this.questions();
    return list[this.currentIndex()] || null;
  });

  readonly currentUserSelected = computed<string[]>(() => {
    return this.userAnswers()[this.currentIndex()] || [];
  });

  readonly isCorrect = computed<boolean>(() => {
    const q = this.currentQuestion();
    if (!q) return false;
    const user = this.currentUserSelected().sort().join('');
    const correct = q.correct_answer.replace(/[^A-Z]/gi, '').split('').sort().join('');
    return user === correct;
  });

  readonly isUnanswered = computed<boolean>(() => {
    return this.currentUserSelected().length === 0;
  });

  readonly optionKeys = computed<string[]>(() => {
    const q = this.currentQuestion();
    if (!q) return [];
    return Object.keys(q.options).sort();
  });

  readonly voteBars = computed<{ letter: string; count: number; percentage: number; isCorrect: boolean }[]>(() => {
    const q = this.currentQuestion();
    if (!q || !q.vote_counts) return [];
    const total = Object.values(q.vote_counts).reduce((a, b) => a + b, 0);
    const correctClean = q.correct_answer.toUpperCase();
    return Object.entries(q.vote_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([letter, count]) => ({
        letter,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        isCorrect: correctClean.includes(letter),
      }));
  });

  nextQuestion() {
    if (this.currentIndex() < this.questions().length - 1) {
      this.currentIndex.update((i) => i + 1);
      this.showDiscussion.set(false);
    }
  }

  prevQuestion() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
      this.showDiscussion.set(false);
    }
  }
}
