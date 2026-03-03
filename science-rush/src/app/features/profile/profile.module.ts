import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileRoutingModule } from './profile-routing.module';

import { MyProfileComponent } from './pages/my-profile/my-profile.component';
import { UserHeaderComponent } from './components/user-header/user-header.component';
import { UserAchievementComponent } from './components/user-achievement/user-achievement.component';
import { UserProBannerComponent } from './components/user-pro-banner/user-pro-banner.component';
import { UserWalletComponent } from './components/user-wallet/user-wallet.component';
import { SharedModule } from '@shared/shared.module';
// import { PremiumPromoCardComponent } from '@shared/components/premium-promo-card/premium-promo-card.component';
import { UpgradeModalComponent } from '../../shared/components/upgrade-modal/upgrade-modal.component';
import { PremiumPromoCardComponent } from '../../shared/components/premium-promo-card/premium-promo-card.component';
import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';
import { FormsModule } from '@angular/forms';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';



@NgModule({
  declarations: [
    MyProfileComponent,
    UserHeaderComponent,
    UserWalletComponent,
    UserAchievementComponent,
    UserProBannerComponent,
    EditProfileModalComponent,
    
    
  ],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    SharedModule,
    UpgradeModalComponent,
    PremiumPromoCardComponent,
    FormsModule,
    SettingsModalComponent
  ]
})
export class ProfileModule { }