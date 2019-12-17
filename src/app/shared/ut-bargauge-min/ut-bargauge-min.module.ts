import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtBargaugeMinComponent } from './ut-bargauge-min.component';
import { GaugesModule } from 'ng-beautiful-gauges';

@NgModule({
  imports: [
    CommonModule,
    GaugesModule
  ],
  declarations: [UtBargaugeMinComponent],
  exports: [UtBargaugeMinComponent]
})
export class UtBargaugeMinModule { }
