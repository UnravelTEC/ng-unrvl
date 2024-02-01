import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScatterplotRoutingModule } from './scatterplot-routing.module';
import { ScatterplotComponent } from './scatterplot.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UtDygraphScatterModule } from 'app/shared/ut-dygraph-scatter/ut-dygraph-scatter.module';


@NgModule({
  declarations: [ScatterplotComponent],
  imports: [
    CommonModule,
    ScatterplotRoutingModule,
    UtDygraphInModule,
    UtDygraphScatterModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ]
})
export class ScatterplotModule { }
