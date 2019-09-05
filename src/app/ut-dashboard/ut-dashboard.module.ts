import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtDashboardRoutingModule } from './ut-dashboard-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UtDashboardTileComponent } from './ut-dashboard-tile/ut-dashboard-tile.component';
import { BrightnessModule } from '../ut-apps/tiles/brightness/brightness.module';
import { TileCo2Module } from '../ut-apps/tiles/tile-co2/tile-co2.module';
import { TileRadiationModule } from '../ut-apps/tiles/tile-radiation/tile-radiation.module';
import { TileRhModule } from '../ut-apps/tiles/tile-rh/tile-rh.module';

@NgModule({
  imports: [
    CommonModule,
    UtDashboardRoutingModule,
    BrightnessModule,
    TileCo2Module,
    TileRadiationModule,
    TileRhModule
  ],
  declarations: [DashboardComponent, UtDashboardTileComponent]
})
export class UtDashboardModule { }
