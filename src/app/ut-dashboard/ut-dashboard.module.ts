import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtDashboardRoutingModule } from './ut-dashboard-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    UtDashboardRoutingModule
  ],
  declarations: [DashboardComponent]
})
export class UtDashboardModule { }
