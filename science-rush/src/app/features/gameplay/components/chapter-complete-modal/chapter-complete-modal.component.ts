import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/button/button.component';
import { MascotComponent } from '@shared/components/mascot/mascot.component';

@Component({
  selector: 'app-chapter-complete-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, MascotComponent],
  template: `
    <div class="modal-overlay">
      <div class="modal-card anim-pop-in">
        <div class="mascot-area">
          <app-mascot emotion="happy"></app-mascot>
        </div>
        
        <h2>Chapter Complete!</h2>
        
        <div class="stars-row">
          <span *ngFor="let s of [1,2,3]" class="star" 
                [class.filled]="s <= stars"
                [style.animation-delay]="s * 200 + 'ms'">★</span>
        </div>

        <div class="stats">
          <p>Accuracy: <strong>{{ accuracy }}%</strong></p>
          <p>XP Earned: <strong>+{{ xp }}</strong></p>
        </div>

        <app-button label="CONTINUE" (btnClick)="onContinue()"></app-button>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;
    
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      @include flex-center;
      backdrop-filter: blur(4px);
    }
    
    .modal-card {
      background: white;
      padding: 2rem;
      border-radius: 20px;
      width: 90%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      border: 2px solid $grey-border;
    }

    .mascot-area { margin-bottom: 1rem; transform: scale(1.2); }
    
    h2 { color: $primary-yellow; font-weight: 900; font-size: 1.8rem; margin-bottom: 0.5rem; text-transform: uppercase; }
    
    .stars-row {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      
      .star {
        color: $grey-light;
        transition: color 0.3s;
        display: inline-block;
        animation: popStar 0.5s backwards;
        
        &.filled { color: $primary-yellow; text-shadow: 0 4px 0 #b38f00; }
      }
    }

    .stats {
      background: $bg-color;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      p { margin: 0.5rem 0; font-size: 1.1rem; color: $grey-text; }
      strong { color: $text-color; }
    }

    @keyframes popStar {
      0% { transform: scale(0); }
      50% { transform: scale(1.5); }
      100% { transform: scale(1); }
    }
    
    .anim-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class ChapterCompleteModalComponent {
  @Input() stars: number = 0;
  @Input() accuracy: number = 0;
  @Input() xp: number = 50;
  @Output() close = new EventEmitter<void>();

  onContinue() { this.close.emit(); }
}