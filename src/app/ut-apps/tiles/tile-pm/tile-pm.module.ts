import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TilePmRoutingModule } from './tile-pm-routing.module';
import { TilePmComponent } from './tile-pm.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';

@NgModule({
  imports: [
    CommonModule,
    TilePmRoutingModule,
    UtDygraphModule,
    UtBargaugeMinModule
  ],
  declarations: [TilePmComponent],
  exports: [TilePmComponent]
})
export class TilePmModule { }
