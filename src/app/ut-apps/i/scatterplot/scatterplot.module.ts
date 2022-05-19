import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScatterplotRoutingModule } from './scatterplot-routing.module';
import { ScatterplotComponent } from './scatterplot.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [ScatterplotComponent],
  imports: [
    CommonModule,
    ScatterplotRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ]
})
export class ScatterplotModule { }
