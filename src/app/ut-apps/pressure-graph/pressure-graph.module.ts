import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

import { PressureGraphRoutingModule } from './pressure-graph-routing.module';
import { PressureGraphComponent } from './pressure-graph.component';

@NgModule({
  imports: [
    CommonModule,
    PressureGraphRoutingModule,
    FormsModule,
    UtDygraphModule
  ],
  declarations: [PressureGraphComponent]
})
export class PressureGraphModule { }
