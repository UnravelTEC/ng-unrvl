import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IndoorclimateRoutingModule } from './indoorclimate-routing.module';
import { IndoorclimateComponent } from './indoorclimate.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';


@NgModule({
  imports: [
    CommonModule,
    IndoorclimateRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [IndoorclimateComponent]
})
export class IndoorclimateModule { }
