import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Co2GraphRoutingModule } from './co2-graph-routing.module';
import { Co2GraphComponent } from './co2-graph.component';

import { NgDygraphsModule } from 'ng-dygraphs';

@NgModule({
  imports: [
    CommonModule,
    Co2GraphRoutingModule,
    NgDygraphsModule
  ],
  declarations: [Co2GraphComponent]
})
export class Co2GraphModule { }
