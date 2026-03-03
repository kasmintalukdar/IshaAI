import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { UpgradeModalComponent } from '@shared/components/upgrade-modal/upgrade-modal.component';
import { UiService } from '@core/services/ui.service';


@Component({
  selector: 'app-root',
  standalone: true, // <--- MUST BE TRUE
  imports: [

    CommonModule, 
    NavbarComponent,
    RouterOutlet,
    RouterModule,
    UpgradeModalComponent
  ], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'science-rush';
  showNavbar = true;
  
  constructor(private router: Router, private ui: UiService) {
    

    // Subscribe to router events to detect URL changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd) // Only trigger when navigation finishes
    ).subscribe((event: any) => {
      // 🙈 Hide navbar if URL includes '/auth' (covers login & signup)
      // You can add other paths here like: !event.url.includes('/admin')

      this.showNavbar = !event.url.includes('/auth/login');
    });
  }
}