import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subject-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subject-card.component.html', 
  styleUrls: ['./subject-card.component.scss']
})
export class SubjectCardComponent {
  @Input() subject!: any;

  get progressPct(): number {
    // 🚨 FIX: Return the 'progress' value directly.
    // Do NOT calculate (completed/total) here.
    return this.subject.progress || 0;
  }
}