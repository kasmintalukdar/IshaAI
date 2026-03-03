// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { GameplayService } from '../../../../core/services/gameplay.service'; // Check this path matches your structure
// import { PathNodeComponent } from '../../components/path-node/path-node.component'; // Check this path

// @Component({
//   selector: 'app-topic-path-view',
//   standalone: true,
//   imports: [CommonModule, PathNodeComponent],
//   templateUrl: './topic-path-view.component.html',
//   styleUrls: ['./topic-path-view.component.scss']
// })
// export class TopicPathViewComponent implements OnInit {
  
//   // ✅ 1. Define the missing properties here
//   topics: any[] = [];
//   chapterId: string = '';
//   chapterName: string = 'Topic'; // Fixes "Property chapterName does not exist"

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private gameplay: GameplayService
//   ) {}

//   ngOnInit(): void {
//     this.chapterId = this.route.snapshot.paramMap.get('chapterId') || '';
    
//     // Optional: Get name from URL query params (e.g., ?name=Electrostatics)
//     this.chapterName = this.route.snapshot.queryParamMap.get('name') || 'Chapter';

//     this.loadTopics();
//   }

//   loadTopics() {
//     this.gameplay.getTopics(this.chapterId).subscribe(data => {
//       // Sort by order_index to ensure zig-zag flow is correct
//       this.topics = data.sort((a, b) => a.orderIndex - b.orderIndex);
//     });
//   }

//   onTopicClick(topicId: string) {
//     this.router.navigate(['/game', topicId]);
//   }

//   // ✅ 2. Define the missing function here
//   goBack() {
//     // Navigate back to the Dashboard (or the previous Subject Path)
//     this.router.navigate(['/dashboard']); 
//   }

//   // Logic to determine Left/Center/Right alignment
//   getAlignment(index: number): string {
//     const mod = index % 4;
//     if (mod === 1 || mod === 3) return 'center';
//     if (mod === 2) return 'left';
//     return 'right'; 
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // 1. Import Location
import { ActivatedRoute, Router } from '@angular/router';
import { GameplayService } from '../../../../core/services/gameplay.service';
import { PathNodeComponent } from '../../components/path-node/path-node.component';

@Component({
  selector: 'app-topic-path-view',
  standalone: true,
  imports: [CommonModule, PathNodeComponent],
  templateUrl: './topic-path-view.component.html',
  styleUrls: ['./topic-path-view.component.scss']
})
export class TopicPathViewComponent implements OnInit {
  
  topics: any[] = [];
  chapterId: string = '';
  chapterName: string = 'Topic';
  defaultIcon = "https://images.unsplash.com/photo-1633493702341-4d04841df53b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D"

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameplay: GameplayService,
    private location: Location // 2. Inject Location Service
  ) {}

  ngOnInit(): void {
    this.chapterId = this.route.snapshot.paramMap.get('chapterId') || '';
    
    // Get name from URL query params (e.g., ?name=Electrostatics)
    this.chapterName = this.route.snapshot.queryParamMap.get('name') || 'Chapter';

    this.loadTopics();
  }

  loadTopics() {
    this.gameplay.getTopics(this.chapterId).subscribe(data => {
      // Sort by order_index to ensure zig-zag flow is correct
      this.topics = data.sort((a, b) => a.orderIndex - b.orderIndex);
    });
  }

  onTopicClick(topicId: string) {
    this.router.navigate(['/game', topicId]);
  }

  goBack() {
    // 3. Use location.back() to return to the previous page (Subject/Chapter list)
    // instead of forcing navigation to /dashboard.
    this.location.back();
  }

  // Logic to determine Left/Center/Right alignment
  getAlignment(index: number): string {
    const mod = index % 4;
    if (mod === 1 || mod === 3) return 'center';
    if (mod === 2) return 'left';
    return 'right'; 
  }
}