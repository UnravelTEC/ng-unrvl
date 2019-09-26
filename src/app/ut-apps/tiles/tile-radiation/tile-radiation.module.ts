import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileRadiationRoutingModule } from './tile-radiation-routing.module';
import { TileRadiationComponent } from './tile-radiation.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';

@NgModule({
  imports: [
    CommonModule,
    TileRadiationRoutingModule,
    UtDygraphModule,
    UtBargaugeMinModule
  ],
  declarations: [TileRadiationComponent],
  exports: [TileRadiationComponent]
})
export class TileRadiationModule { }
