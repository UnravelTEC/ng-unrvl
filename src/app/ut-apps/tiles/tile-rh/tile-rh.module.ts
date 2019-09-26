import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileRhRoutingModule } from './tile-rh-routing.module';
import { TileRhComponent } from './tile-rh.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';

@NgModule({
  imports: [
    CommonModule,
    TileRhRoutingModule,
    UtDygraphModule,
    UtBargaugeMinModule
  ],
  declarations: [TileRhComponent],
  exports: [TileRhComponent]
})
export class TileRhModule { }
