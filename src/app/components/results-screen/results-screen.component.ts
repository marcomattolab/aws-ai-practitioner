import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamResult } from '../../core/models/question.model';

@Component({
  selector: 'app-results-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-screen.component.html',
  styleUrl: './results-screen.component.css',
})
export class ResultsScreenComponent {
  readonly result = input.required<ExamResult>();

  readonly home = output<void>();
  readonly review = output<void>();
  readonly practiceWrong = output<void>();
  readonly retake = output<void>();

  readonly formattedTime = computed<string>(() => {
    const s = this.result().elapsedSeconds;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  });
}
