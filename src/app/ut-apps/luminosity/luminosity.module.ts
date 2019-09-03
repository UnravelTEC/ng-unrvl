import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LuminosityRoutingModule } from './luminosity-routing.module';
import { LuminosityComponent } from './luminosity.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    LuminosityRoutingModule,
    UtDygraphModule
  ],
  declarations: [LuminosityComponent]
})
export class LuminosityModule { }
