import { Component, inject, signal } from '@angular/core';
import { ExamConfig, ExamResult, Question, ScreenMode } from './core/models/question.model';
import { QuestionService } from './core/services/question.service';
import { ExamService } from './core/services/exam.service';
import { SoundService } from './core/services/sound.service';
import { HomeScreenComponent } from './components/home-screen/home-screen.component';
import { ExamSetupComponent } from './components/exam-setup/exam-setup.component';
import { PracticeScreenComponent } from './components/practice-screen/practice-screen.component';
import { ExamScreenComponent } from './components/exam-screen/exam-screen.component';
import { ResultsScreenComponent } from './components/results-screen/results-screen.component';
import { ReviewScreenComponent } from './components/review-screen/review-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HomeScreenComponent,
    ExamSetupComponent,
    PracticeScreenComponent,
    ExamScreenComponent,
    ResultsScreenComponent,
    ReviewScreenComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly qService = inject(QuestionService);
  private readonly exam = inject(ExamService);
  private readonly sound = inject(SoundService);

  readonly screen = signal<ScreenMode>('home');
  readonly practiceContext = signal<'all' | 'wrong'>('all');
  readonly practiceQuestions = signal<Question[]>([]);
  readonly examResult = signal<ExamResult | null>(null);
  readonly reviewQuestions = signal<Question[]>([]);
  readonly reviewAnswers = signal<Record<number, string[]>>({});

  goHome() {
    this.sound.stopAll();
    this.exam.cleanup();
    this.screen.set('home');
  }

  openExamSetup() {
    this.screen.set('exam-setup');
  }

  startPractice(context: 'all' | 'wrong') {
    let questions =
      context === 'wrong' ? this.qService.getFailedQuestions() : this.qService.allQuestions();
    let effectiveContext = context;
    if (questions.length === 0) {
      questions = this.qService.allQuestions();
      effectiveContext = 'all';
    }
    this.practiceContext.set(effectiveContext);
    this.practiceQuestions.set(questions);
    this.screen.set('practice');
  }

  startExam(config: ExamConfig) {
    this.sound.stopAll();
    this.exam.startExam(config, this.qService.allQuestions());
    this.screen.set('exam');
  }

  cancelExam() {
    this.sound.stopAll();
    this.exam.cleanup();
    this.screen.set('home');
  }

  onExamFinished(result: ExamResult) {
    this.examResult.set(result);
    this.screen.set('results');
  }

  reviewExam() {
    this.reviewQuestions.set(this.exam.questions());
    this.reviewAnswers.set(this.exam.selectedAnswers());
    this.screen.set('review');
  }

  backToResults() {
    this.screen.set('results');
  }

  retakeExam() {
    this.exam.startExam(this.exam.config(), this.qService.allQuestions());
    this.screen.set('exam');
  }

  practiceWrongFromResult() {
    const wrong = this.examResult()?.wrongQuestions ?? [];
    this.practiceContext.set('wrong');
    this.practiceQuestions.set(wrong.length > 0 ? wrong : this.qService.allQuestions());
    this.screen.set('practice');
  }
}
