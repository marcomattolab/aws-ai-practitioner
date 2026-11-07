import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../../core/services/question.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-home-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css',
})
export class HomeScreenComponent {
  protected readonly qService = inject(QuestionService);
  protected readonly sound = inject(SoundService);

  readonly startPractice = output<'all' | 'wrong'>();
  readonly startExamSetup = output<void>();

  onPracticeClick() {
    this.sound.playIntro();
    this.startPractice.emit('all');
  }

  onPracticeWrongClick() {
    this.sound.playIntro();
    this.startPractice.emit('wrong');
  }

  onExamClick() {
    this.startExamSetup.emit();
  }

  onResetProgress() {
    if (confirm('Are you sure you want to reset all your progress and history?')) {
      this.qService.resetProgress();
    }
  }
}
