import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdcDiffRoutingModule } from './adc-diff-routing.module';
import { AdcDiffComponent } from './adc-diff.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    AdcDiffRoutingModule,
    UtDygraphModule
  ],
  declarations: [AdcDiffComponent]
})
export class AdcDiffModule { }
