import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileUvRoutingModule } from './tile-uv-routing.module';
import { TileUvComponent } from './tile-uv.component';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    TileUvRoutingModule,
    UtDygraphInModule,
    UtBargaugeMinModule
  ],
  declarations: [TileUvComponent],
  exports: [TileUvComponent]
})
export class TileUvModule { }
