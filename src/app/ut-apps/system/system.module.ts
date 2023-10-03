import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { UtDashboardTileComponent } from '../../ut-dashboard/ut-dashboard-tile/ut-dashboard-tile.component';
import { UtDashboardTileModule } from '../../ut-dashboard/ut-dashboard-tile/ut-dashboard-tile.module';
import { SystemRoutingModule } from './system-routing.module';
import { SystemComponent } from './system.component';


@NgModule({
  declarations: [SystemComponent],
  imports: [
    CommonModule,
    UtDashboardTileModule,
    SystemRoutingModule
  ]
})
export class SystemModule { }
