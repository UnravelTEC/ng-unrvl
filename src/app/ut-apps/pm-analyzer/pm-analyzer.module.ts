import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PmAnalyzerRoutingModule } from './pm-analyzer-routing.module';
import { PmAnalyzerComponent } from './pm-analyzer.component';
import { ChartsModule } from 'ng2-charts';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
// import { PlotlyViaWindowModule } from 'angular-plotly.js';

@NgModule({
  imports: [
    CommonModule,
    PmAnalyzerRoutingModule,
    ChartsModule,
    UtDygraphModule
  ],
  declarations: [PmAnalyzerComponent]
})
export class PmAnalyzerModule { }
