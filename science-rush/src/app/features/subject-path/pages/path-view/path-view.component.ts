// import { Component, OnInit } from '@angular/core'; // Removed OnDestroy
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// // Removed: Subscription import

// // --- SERVICES ---
// import { GameplayService } from '@core/services/gameplay.service';
// // Removed: SocketService (Not needed here anymore)

// // --- COMPONENTS ---
// import { ButtonComponent } from '@shared/components/button/button.component';
// import { PathNodeComponent } from '../../components/path-node/path-node.component';

// @Component({
//   selector: 'app-path-view',
//   standalone: true,
//   imports: [CommonModule, ButtonComponent, PathNodeComponent],
//   templateUrl: './path-view.component.html',
//   styleUrls: ['./path-view.component.scss']
// })
// export class PathViewComponent implements OnInit {
//   chapters: any[] = [];
//   subjectName: string = '';

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private gameplay: GameplayService
//     // Removed: private socket: SocketService
//   ) {}

//   ngOnInit(): void {
//     // 1. Get Subject
//     this.subjectName = this.route.snapshot.paramMap.get('id') || 'Physics';
    
//     // 2. Load Data (Standard HTTP Fetch)
//     // This will hit your backend, check Redis, and return the latest map.
//     this.loadPath();
//   }

//   loadPath() {
//     this.gameplay.getChapters(this.subjectName).subscribe(data => {
//       this.chapters = data.sort((a, b) => a.orderIndex - b.orderIndex);
//     });
//   }

//   onChapterClick(chapterId: string) {
//     // OLD: this.router.navigate(['/game', this.subjectName, chapterId]);
    
//     // NEW: Go to Topic Path
//     this.router.navigate(['/path/chapter', chapterId]);
//   }

//   goBack() {
//     this.router.navigate(['/dashboard']);
//   }

//   // --- HELPER: ZIG-ZAG ALIGNMENT ---
//   getAlignment(index: number): string {
//     const mod = index % 4;
//     if (mod === 1 || mod === 3) return 'center';
//     if (mod === 2) return 'left';
//     return 'right'; 
//   }
// }








import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { ActivatedRoute, Router } from '@angular/router';
import { GameplayService } from '@core/services/gameplay.service';
import { PathNodeComponent } from '../../components/path-node/path-node.component';

@Component({
  selector: 'app-path-view',
  standalone: true,
  imports: [CommonModule, PathNodeComponent],
  templateUrl: './path-view.component.html',
  styleUrls: ['./path-view.component.scss']
})
export class PathViewComponent implements OnInit {
  chapters: any[] = [];
  subjectName: string = '';
  subjectImage: string = '';
  defaultIcon = "https://images.unsplash.com/photo-1633493702341-4d04841df53b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D"

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameplay: GameplayService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.subjectName = this.route.snapshot.paramMap.get('id') || 'Physics';
    this.loadPath();
  }

  loadPath() {
    this.gameplay.getChapters(this.subjectName).subscribe(data => {
      this.chapters = data.sort((a, b) => a.orderIndex - b.orderIndex);
    });
  }

  onChapterClick(chapterId: string) {
    this.router.navigate(['/path/chapter', chapterId]);
  }

  goBack() {
    this.location.back();
  }

  // --- HELPER: STATUS TEXT LOGIC ---
  getChapterStatusLabel(chapter: any): string {
    if (chapter.status === 'COMPLETED') {
      return 'COMPLETED';
    }
    if (chapter.progress > 0) {
      return 'CONTINUE';
    }
    if (chapter.status === 'LOCKED') {
      return 'LOCKED';
    }
    return 'START';
  }

  // --- HELPER: ALIGNMENT ---
  getAlignment(index: number): string {
    const mod = index % 4;
    if (mod === 1 || mod === 3) return 'center';
    if (mod === 2) return 'left';
    return 'right'; 
  }
}