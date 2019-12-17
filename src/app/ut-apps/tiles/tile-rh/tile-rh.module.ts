import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileRhRoutingModule } from './tile-rh-routing.module';
import { TileRhComponent } from './tile-rh.component';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    TileRhRoutingModule,
    UtDygraphInModule,
    UtBargaugeMinModule
  ],
  declarations: [TileRhComponent],
  exports: [TileRhComponent]
})
export class TileRhModule { }
