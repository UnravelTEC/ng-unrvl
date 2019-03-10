import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Co2RoutingModule } from './co2-routing.module';
import { Co2Component } from './co2.component';

import { GaugesModule } from 'ng-beautiful-gauges';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    Co2RoutingModule,
    UtDygraphModule,
    GaugesModule
  ],
  declarations: [Co2Component]
})
export class Co2Module {}
