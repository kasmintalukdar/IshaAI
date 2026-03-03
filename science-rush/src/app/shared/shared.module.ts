import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PremiumPromoCardComponent } from './components/premium-promo-card/premium-promo-card.component';
import { UpgradeModalComponent } from './components/upgrade-modal/upgrade-modal.component';

import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterModule } from '@angular/router';


import { LoaderComponent } from './components/loader/loader.component'; 

@NgModule({

  declarations:[],

  imports: [
    CommonModule,
    PremiumPromoCardComponent,
    UpgradeModalComponent,

    NavbarComponent,
    RouterModule,

    LoaderComponent

  ],
  exports: [
    PremiumPromoCardComponent,
    UpgradeModalComponent,

    NavbarComponent,

    LoaderComponent

  ]
})
export class SharedModule { }
