import { Component, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService } from '../../core/services/exam.service';
import { ExamResult } from '../../core/models/question.model';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-exam-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-screen.component.html',
  styleUrl: './exam-screen.component.css',
})
export class ExamScreenComponent {
  protected readonly exam = inject(ExamService);
  protected readonly sound = inject(SoundService);

  readonly cancel = output<void>();
  readonly finish = output<ExamResult>();

  readonly showConfirmFinishModal = signal<boolean>(false);
  readonly showQuestionPalette = signal<boolean>(false);

  readonly formattedTime = computed<string>(() => {
    const s = this.exam.timeRemainingSeconds();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly isTimeUrgent = computed<boolean>(() => this.exam.timeRemainingSeconds() < 300); // < 5 mins
  readonly isTimeWarning = computed<boolean>(() => this.exam.timeRemainingSeconds() < 600); // < 10 mins

  readonly unansweredCount = computed<number>(() => {
    const total = this.exam.questions().length;
    const answered = Object.keys(this.exam.selectedAnswers()).length;
    return total - answered;
  });

  readonly optionKeys = computed<string[]>(() => {
    const q = this.exam.currentQuestion();
    if (!q) return [];
    return Object.keys(q.options).sort();
  });

  onSelectOption(letter: string) {
    this.sound.playSelectOption();
    this.exam.toggleOption(letter);
  }

  onFinishClick() {
    this.showConfirmFinishModal.set(true);
  }

  confirmFinish() {
    this.showConfirmFinishModal.set(false);
    const result = this.exam.finishExam();
    this.finish.emit(result);
  }

  cancelFinish() {
    this.showConfirmFinishModal.set(false);
  }
}
