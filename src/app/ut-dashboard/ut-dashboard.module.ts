import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtDashboardRoutingModule } from './ut-dashboard-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UtDashboardTileComponent } from './ut-dashboard-tile/ut-dashboard-tile.component';

@NgModule({
  imports: [
    CommonModule,
    UtDashboardRoutingModule
  ],
  declarations: [DashboardComponent, UtDashboardTileComponent]
})
export class UtDashboardModule { }
