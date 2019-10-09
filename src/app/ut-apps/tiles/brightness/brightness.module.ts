import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BrightnessRoutingModule } from './brightness-routing.module';
import { BrightnessComponent } from './brightness.component';
import { UtBargaugeMinModule } from '../../../shared/ut-bargauge-min/ut-bargauge-min.module';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    BrightnessRoutingModule,
    UtDygraphInModule,
    UtBargaugeMinModule
  ],
  declarations: [BrightnessComponent],
  exports:[BrightnessComponent]
})
export class BrightnessModule { }
