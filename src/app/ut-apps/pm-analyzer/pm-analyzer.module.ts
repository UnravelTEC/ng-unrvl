import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PmAnalyzerRoutingModule } from './pm-analyzer-routing.module';
import { PmAnalyzerComponent } from './pm-analyzer.component';
import { ChartsModule } from 'ng2-charts';
// import { PlotlyViaWindowModule } from 'angular-plotly.js';

@NgModule({
  imports: [
    CommonModule,
    PmAnalyzerRoutingModule,
    ChartsModule
  ],
  declarations: [PmAnalyzerComponent]
})
export class PmAnalyzerModule { }
