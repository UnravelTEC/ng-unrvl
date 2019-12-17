import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileCo2RoutingModule } from './tile-co2-routing.module';
import { TileCo2Component } from './tile-co2.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';

@NgModule({
  imports: [
    CommonModule,
    TileCo2RoutingModule,
    UtDygraphInModule,
    UtBargaugeMinModule
  ],
  declarations: [TileCo2Component],
  exports: [TileCo2Component]
})
export class TileCo2Module {}
