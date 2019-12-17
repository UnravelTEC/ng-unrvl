import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileLoadRoutingModule } from './tile-load-routing.module';
import { TileLoadComponent } from './tile-load.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';

@NgModule({
  imports: [
    CommonModule,
    TileLoadRoutingModule,
    UtDygraphInModule,
    UtBargaugeMinModule
  ],
  declarations: [TileLoadComponent],
  exports: [TileLoadComponent]
})
export class TileLoadModule { }
