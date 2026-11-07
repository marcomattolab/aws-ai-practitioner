import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamConfig } from '../../core/models/question.model';

@Component({
  selector: 'app-exam-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-setup.component.html',
  styleUrl: './exam-setup.component.css',
})
export class ExamSetupComponent {
  readonly numQuestions = signal<number>(65);
  readonly passThreshold = signal<number>(70);

  readonly back = output<void>();
  readonly start = output<ExamConfig>();

  onStart() {
    this.start.emit({
      numQuestions: this.numQuestions(),
      passThreshold: this.passThreshold(),
    });
  }
}
