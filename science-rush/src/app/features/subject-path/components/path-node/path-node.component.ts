// import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Chapter } from '@core/models/game-data.model';

// @Component({
//   selector: 'app-path-node',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './path-node.component.html',
//   styleUrls: ['./path-node.component.scss']
// })
// export class PathNodeComponent implements OnInit {
//   @Input() chapter!: Chapter;
//   @Input() index: number = 0;
//   @Output() nodeClick = new EventEmitter<string>();

//   // SVG Ring Configuration
//   radius = 48; // Radius of the ring
//   circumference = 2 * Math.PI * this.radius;
//   dashOffset = 0;

//   ngOnInit() {
//     this.calculateProgress();
//   }

//   // Recalculate if inputs change (e.g. after playing a game)
//   ngOnChanges() {
//     this.calculateProgress();
//   }

//   calculateProgress() {
//     // Logic: Offset = Circumference - (Progress / 100 * Circumference)
//     // 100% progress = 0 offset (Full circle)
//     // 0% progress = Full circumference offset (Empty circle)
//     const progress = this.chapter.progress || 0;
//     this.dashOffset = this.circumference - (progress / 100) * this.circumference;
//   }

//   onClick() {
//     // Locked check removed. User can play anything.
//     this.nodeClick.emit(this.chapter.id);
//   }
// }


import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-path-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './path-node.component.html',
  styleUrls: ['./path-node.component.scss']
})
export class PathNodeComponent implements OnChanges {
  @Input() title: string = '';
  @Input() icon: string = 'assets/icons/topic.svg';
  @Input() progress: number = 0; // 0 to 100
  @Input() status: 'LOCKED' | 'ACTIVE' | 'COMPLETED' = 'LOCKED';
  @Input() position: 'left' | 'center' | 'right' = 'center';

  // --- SVG CONFIG ---
  radius = 45;
  circumference = 2 * Math.PI * this.radius;
  strokeDashoffset = this.circumference;
  
  // Animation State
  isAnimating = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progress']) {
      this.updateRing();
    }
  }

  updateRing() {
    // 1. Calculate Offset (Arc Length)
    // Formula: Circumference - (Percent / 100 * Circumference)
    const progressOffset = this.circumference - (this.progress / 100) * this.circumference;
    
    // 2. Trigger Animation
    this.isAnimating = true;
    setTimeout(() => {
      this.strokeDashoffset = progressOffset;
      this.isAnimating = false;
    }, 100); // Small delay to ensure render
  }

  onClick() {
    if (this.status !== 'LOCKED') {
      // Navigate to Game Arena (Handled by parent usually, or emit event)
    }
  }
}