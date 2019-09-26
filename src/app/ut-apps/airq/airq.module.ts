import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AirqRoutingModule } from './airq-routing.module';
import { AirqComponent } from './airq.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { UtFetchmetricsModule } from '../../shared/ut-fetchmetrics/ut-fetchmetrics.module';
import { FormsModule } from '@angular/forms';
import { GaugesModule } from 'ng-beautiful-gauges';

@NgModule({
  imports: [
    CommonModule,
    AirqRoutingModule,
    UtDygraphModule,
    UtFetchmetricsModule,
    FormsModule,
    GaugesModule
  ],
  declarations: [AirqComponent]
})
export class AirqModule { }
