import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- Required

@Component({
  selector: 'app-mascot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mascot-container" [ngClass]="emotion">
      <img *ngIf="emotion === 'neutral'" src="assets/images/mascots/neutral.svg" alt="Ready">
      <img *ngIf="emotion === 'happy'" src="assets/images/mascots/happy.svg" alt="Happy">
      <img *ngIf="emotion === 'sad'" src="assets/images/mascots/sad.svg" alt="Sad">
      <img *ngIf="emotion === 'thinking'" src="assets/images/mascots/thinking.svg" alt="Thinking">
    </div>
  `,
  styles: [`
    .mascot-container { width: 100px; height: 100px; transition: transform 0.2s; }
    img { width: 100%; height: 100%; }
    .happy { animation: bounce 1s infinite; }
    .sad { animation: shake 0.5s; }
    /* Keyframes usually global, but if missing: */
    @keyframes bounce { 0%, 100% {transform: translateY(0);} 50% {transform: translateY(-10px);} }
    @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-5px);} 75% {transform: translateX(5px);} }
  `]
})
export class MascotComponent {
  @Input() emotion: 'neutral' | 'happy' | 'sad' | 'thinking' = 'neutral';
}