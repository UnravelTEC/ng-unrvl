import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AtmosphereRoutingModule } from './atmosphere-routing.module';
import { AtmosphereComponent } from './atmosphere.component';
import { UtFetchmetricsModule } from 'app/shared/ut-fetchmetrics/ut-fetchmetrics.module';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    AtmosphereRoutingModule,
    UtFetchmetricsModule,
    UtDygraphModule
  ],
  declarations: [AtmosphereComponent]
})
export class AtmosphereModule { }
