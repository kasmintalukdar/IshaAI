


import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../core/models/game-data.model';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-card.component.html',
  styleUrls: ['./question-card.component.scss']
})
export class QuestionCardComponent implements OnChanges {
  
  @Input() question!: Question;

  // Parent controls these
  @Input() disabled: boolean = false;
  @Input() showResult: boolean = false;          // ✅ tells when to reveal answer
  @Input() correctOptionId: string | null = null; // ✅ tells which is correct

  @Output() optionSelected = new EventEmitter<string>();

  selectedOptionId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Reset selection when question changes
    if (changes['question']) {
      this.selectedOptionId = null;
    }
  }

  selectOption(id: string) {
    if (this.disabled || this.showResult) return;

    this.selectedOptionId = id;
    this.optionSelected.emit(id);
  }

  // Helper methods for template
  isCorrect(id: string): boolean {
    return this.showResult && id === this.correctOptionId;
  }

  isWrong(id: string): boolean {
    return this.showResult && id === this.selectedOptionId && id !== this.correctOptionId;
  }

  isDimmed(id: string): boolean {
    return this.showResult && id !== this.correctOptionId && id !== this.selectedOptionId;
  }
}
