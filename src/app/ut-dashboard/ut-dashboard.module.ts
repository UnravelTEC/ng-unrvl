import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtDashboardRoutingModule } from './ut-dashboard-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UtDashboardTileComponent } from './ut-dashboard-tile/ut-dashboard-tile.component';
import { BrightnessModule } from '../ut-apps/tiles/brightness/brightness.module';

@NgModule({
  imports: [
    CommonModule,
    UtDashboardRoutingModule,
    BrightnessModule
  ],
  declarations: [DashboardComponent, UtDashboardTileComponent]
})
export class UtDashboardModule { }
