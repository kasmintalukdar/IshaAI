import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { userStats, ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-user-achievement',
  standalone: false,
  templateUrl: './user-achievement.component.html',
  styleUrl: './user-achievement.component.scss'
})
export class UserAchievementComponent implements OnInit {
  
  stats$!:Observable<userStats | null>
  
  constructor(private service: ProfileService){}

  ngOnInit(): void {
      this.stats$ = this.service.getUserStats()
  }
}
