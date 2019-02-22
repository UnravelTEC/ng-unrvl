import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdcRoutingModule } from './adc-routing.module';
import { AdcComponent } from './adc.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    AdcRoutingModule,
    UtDygraphModule
  ],
  declarations: [AdcComponent]
})
export class AdcModule { }
