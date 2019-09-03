import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BrightnessRoutingModule } from './brightness-routing.module';
import { BrightnessComponent } from './brightness.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { GaugesModule } from 'ng-beautiful-gauges';

@NgModule({
  imports: [
    CommonModule,
    BrightnessRoutingModule,
    UtDygraphModule,
    GaugesModule
  ],
  declarations: [BrightnessComponent],
  exports:[BrightnessComponent]
})
export class BrightnessModule { }
