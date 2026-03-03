import { Component, OnInit } from '@angular/core';
import { UserGems, ProfileService } from '../../services/profile.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-wallet',
  standalone: false,
  templateUrl: './user-wallet.component.html',
  styleUrl: './user-wallet.component.scss'
})
export class UserWalletComponent implements OnInit {

  userGems$!: Observable<UserGems | null>

  constructor(private service: ProfileService){}

  ngOnInit(): void {
    this.userGems$ = this.service.getUserGems()
    this.userGems$.subscribe(data => console.log(data))
  }

}
