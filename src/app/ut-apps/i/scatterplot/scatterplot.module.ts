import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScatterplotRoutingModule } from './scatterplot-routing.module';
import { ScatterplotComponent } from './scatterplot.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [ScatterplotComponent],
  imports: [
    CommonModule,
    ScatterplotRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ]
})
export class ScatterplotModule { }
