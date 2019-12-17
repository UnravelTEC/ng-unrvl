import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TilePmRoutingModule } from './tile-pm-routing.module';
import { TilePmComponent } from './tile-pm.component';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    TilePmRoutingModule,
    UtDygraphInModule,
    UtBargaugeMinModule
  ],
  declarations: [TilePmComponent],
  exports: [TilePmComponent]
})
export class TilePmModule { }
