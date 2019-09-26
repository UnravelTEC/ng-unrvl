import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BrightnessRoutingModule } from './brightness-routing.module';
import { BrightnessComponent } from './brightness.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';

@NgModule({
  imports: [
    CommonModule,
    BrightnessRoutingModule,
    UtDygraphModule,
    UtBargaugeMinModule
  ],
  declarations: [BrightnessComponent],
  exports:[BrightnessComponent]
})
export class BrightnessModule { }
